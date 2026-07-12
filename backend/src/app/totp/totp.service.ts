import type { User } from '#generated/prisma/client.js';
import * as OTPAuth from 'otpauth';
import { randomInt } from 'node:crypto';
import { type AppConfig } from '#config';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';
import { Config } from '#core/ioc/decorators.js';
import { encryptPassword, isPasswordMatch } from '#core/encryption';

const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Per-account throttling (RFC 6238 §5.2): the IP rate limiter alone still
// allows enough guesses per day to brute-force a 6-digit code from a botnet.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

@injectable()
export class TotpService extends BaseService {
  constructor(@Config() private readonly config: AppConfig) {
    super();
  }

  async generateTOTP(user: User) {
    const secret = new OTPAuth.Secret();

    const totp = new OTPAuth.TOTP({
      issuer: this.config.appName,
      label: user.email,
      secret,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        totpSecret: secret.base32,
      },
    });

    // Generate the URL
    return {
      url: totp.toString(),
      secret: secret.base32,
    };
  }

  async validateTOTP(user: User, token: string) {
    this.verifyTOTP(user, token);

    // Enable 2FA after validation
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
      },
    });
  }

  verifyTOTP(user: User, token: string) {
    if (!this.isValidTOTP(user, token)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid TOTP');
    }
  }

  private isValidTOTP(user: User, token: string): boolean {
    if (!user.totpSecret) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'TOTP setup required');
    }

    // Create a TOTP object with the user's secret
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.totpSecret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    // Validate the token
    return totp.validate({ token, window: 1 }) !== null;
  }

  async disableTOTP(user: User) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        totpSecret: null,
        twoFactorEnabled: false,
      },
    });

    await this.prisma.twoFactorRecoveryCode.deleteMany({
      where: { userId: user.id },
    });
  }

  /**
   * Generate a fresh set of single-use recovery codes for the user, replacing
   * any existing ones. Only the hashes are stored; the plaintext codes are
   * returned once and cannot be recovered afterwards.
   */
  async generateRecoveryCodes(user: User): Promise<string[]> {
    const codes = Array.from({ length: RECOVERY_CODE_COUNT }, () =>
      generateRecoveryCode(),
    );

    const hashed = await Promise.all(
      codes.map((code) => encryptPassword(normalizeRecoveryCode(code))),
    );

    await this.prisma.$transaction([
      this.prisma.twoFactorRecoveryCode.deleteMany({
        where: { userId: user.id },
      }),
      this.prisma.twoFactorRecoveryCode.createMany({
        data: hashed.map((code) => ({
          userId: user.id,
          code,
        })),
      }),
    ]);

    return codes;
  }

  /**
   * Verify a login challenge that may be either a TOTP token or a recovery
   * code. Recovery codes are consumed on a successful match. Repeated
   * failures lock the account's second factor temporarily.
   */
  async verifyTwoFactor(user: User, code: string): Promise<void> {
    if (user.twoFactorLockedUntil && user.twoFactorLockedUntil > new Date()) {
      throw new ApiError(
        httpStatus.TOO_MANY_REQUESTS,
        'Too many failed two-factor attempts. Try again later.',
      );
    }

    const normalized = code.trim();

    // A 6-digit numeric value is a TOTP token; anything else is treated as a
    // recovery code.
    const valid = /^\d{6}$/.test(normalized)
      ? this.isValidTOTP(user, normalized)
      : await this.consumeRecoveryCode(user, normalized);

    if (!valid) {
      await this.registerFailedTwoFactorAttempt(user);
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid TOTP');
    }

    if (user.twoFactorFailedAttempts > 0 || user.twoFactorLockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { twoFactorFailedAttempts: 0, twoFactorLockedUntil: null },
      });
    }
  }

  private async registerFailedTwoFactorAttempt(user: User): Promise<void> {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorFailedAttempts: { increment: 1 } },
    });

    if (updated.twoFactorFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorFailedAttempts: 0,
          twoFactorLockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
        },
      });
    }
  }

  private async consumeRecoveryCode(
    user: User,
    code: string,
  ): Promise<boolean> {
    const normalized = normalizeRecoveryCode(code);

    const candidates = await this.prisma.twoFactorRecoveryCode.findMany({
      where: { userId: user.id, usedAt: null },
    });

    for (const candidate of candidates) {
      if (await isPasswordMatch(normalized, candidate.code)) {
        await this.prisma.twoFactorRecoveryCode.update({
          where: { id: candidate.id },
          data: { usedAt: new Date() },
        });
        return true;
      }
    }

    return false;
  }
}

function generateRecoveryCode(): string {
  const half = () =>
    Array.from(
      { length: 5 },
      () => RECOVERY_CODE_ALPHABET[randomInt(RECOVERY_CODE_ALPHABET.length)],
    ).join('');

  return `${half()}-${half()}`;
}

function normalizeRecoveryCode(code: string): string {
  // Strip formatting (dashes, spaces) so codes match regardless of how the
  // user typed them.
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
