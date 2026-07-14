import type { User, UserTwoFactor } from '#generated/prisma/client.js';
import * as OTPAuth from 'otpauth';
import { createHmac, randomInt } from 'node:crypto';
import { type AppConfig } from '#config';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';
import { Config } from '#core/ioc/decorators.js';

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

  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const twoFactor = await this.prisma.userTwoFactor.findUnique({
      where: { userId },
      select: { confirmedAt: true },
    });

    return twoFactor?.confirmedAt != null;
  }

  async generateTOTP(user: User) {
    const existing = await this.prisma.userTwoFactor.findUnique({
      where: { userId: user.id },
    });

    // Prevent reset
    if (existing?.confirmedAt) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Two factor authentication already enabled.',
      );
    }

    const secret = new OTPAuth.Secret();

    const totp = new OTPAuth.TOTP({
      issuer: this.config.appName,
      label: user.email,
      secret,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    await this.prisma.userTwoFactor.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        secret: secret.base32,
      },
      update: {
        secret: secret.base32,
        confirmedAt: null,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    // Generate the URL
    return {
      url: totp.toString(),
      secret: secret.base32,
    };
  }

  async validateTOTP(userId: string, token: string) {
    const twoFactor = await this.getTwoFactorOrFail(userId);

    if (!this.isValidTOTP(twoFactor.secret, token)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid TOTP');
    }

    // Enable 2FA after validation
    await this.prisma.userTwoFactor.update({
      where: { userId },
      data: {
        confirmedAt: twoFactor.confirmedAt ?? new Date(),
      },
    });
  }

  async disableTOTP(userId: string) {
    // Recovery codes are removed by the cascade
    await this.prisma.userTwoFactor.deleteMany({
      where: { userId },
    });
  }

  /**
   * Generate a fresh set of single-use recovery codes for the user, replacing
   * any existing ones. Only the hashes are stored; the plaintext codes are
   * returned once and cannot be recovered afterwards.
   */
  async generateRecoveryCodes(userId: string): Promise<string[]> {
    const codes = Array.from(
      { length: RECOVERY_CODE_COUNT },
      generateRecoveryCode,
    );

    const hashed = codes.map((code) =>
      this.hashRecoveryCode(normalizeRecoveryCode(code)),
    );

    await this.prisma.$transaction([
      this.prisma.twoFactorRecoveryCode.deleteMany({
        where: { userId },
      }),
      this.prisma.twoFactorRecoveryCode.createMany({
        data: hashed.map((code) => ({
          userId,
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
  async verifyTwoFactor(userId: string, code: string): Promise<void> {
    const twoFactor = await this.getTwoFactorOrFail(userId);

    if (!twoFactor.confirmedAt) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Two factor authentication not enabled.',
      );
    }

    if (twoFactor.lockedUntil && twoFactor.lockedUntil > new Date()) {
      throw new ApiError(
        httpStatus.TOO_MANY_REQUESTS,
        'Too many failed two-factor attempts. Try again later.',
      );
    }

    const normalized = code.trim();

    // A 6-digit numeric value is a TOTP token; anything else is treated as a
    // recovery code.
    const valid = /^\d{6}$/.test(normalized)
      ? this.isValidTOTP(twoFactor.secret, normalized)
      : await this.consumeRecoveryCode(userId, normalized);

    if (!valid) {
      await this.registerFailedAttempt(twoFactor);
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid TOTP');
    }

    if (twoFactor.failedAttempts > 0 || twoFactor.lockedUntil) {
      await this.prisma.userTwoFactor.update({
        where: { userId },
        data: { failedAttempts: 0, lockedUntil: null },
      });
    }
  }

  private async getTwoFactorOrFail(userId: string): Promise<UserTwoFactor> {
    const twoFactor = await this.prisma.userTwoFactor.findUnique({
      where: { userId },
    });

    if (!twoFactor) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'TOTP setup required');
    }

    return twoFactor;
  }

  private isValidTOTP(secret: string, token: string): boolean {
    // Create a TOTP object with the user's secret
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(secret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    // Validate the token
    return totp.validate({ token, window: 1 }) !== null;
  }

  private async registerFailedAttempt(twoFactor: UserTwoFactor): Promise<void> {
    const updated = await this.prisma.userTwoFactor.update({
      where: { userId: twoFactor.userId },
      data: { failedAttempts: { increment: 1 } },
    });

    if (updated.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      await this.prisma.userTwoFactor.update({
        where: { userId: twoFactor.userId },
        data: {
          failedAttempts: 0,
          lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
        },
      });
    }
  }

  private async consumeRecoveryCode(
    userId: string,
    code: string,
  ): Promise<boolean> {
    const hashed = this.hashRecoveryCode(normalizeRecoveryCode(code));

    // Single conditional update so a code cannot be consumed twice, even by
    // concurrent requests.
    const { count } = await this.prisma.twoFactorRecoveryCode.updateMany({
      where: { userId, code: hashed, usedAt: null },
      data: { usedAt: new Date() },
    });

    return count > 0;
  }

  // Recovery codes are random 50-bit values, not user-chosen passwords, so a
  // fast keyed hash is sufficient and allows direct lookup by digest. The
  // HMAC key lives outside the database, so a leaked table alone cannot be
  // brute-forced.
  private hashRecoveryCode(code: string): string {
    return createHmac('sha256', this.config.totp.recoveryCodeSecret)
      .update(code)
      .digest('hex');
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
