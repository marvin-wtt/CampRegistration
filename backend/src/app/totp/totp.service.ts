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
    const delta = totp.validate({ token, window: 1 });

    if (delta === null) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid TOTP');
    }
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
   * code. Recovery codes are consumed on a successful match.
   */
  async verifyTwoFactor(user: User, code: string): Promise<void> {
    const normalized = code.trim();

    // A 6-digit numeric value is a TOTP token; anything else is treated as a
    // recovery code.
    if (/^\d{6}$/.test(normalized)) {
      this.verifyTOTP(user, normalized);
      return;
    }

    await this.consumeRecoveryCode(user, normalized);
  }

  private async consumeRecoveryCode(user: User, code: string): Promise<void> {
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
        return;
      }
    }

    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid TOTP');
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
