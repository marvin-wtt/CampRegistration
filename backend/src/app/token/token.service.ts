import jwt from 'jsonwebtoken';
import moment, { type Moment } from 'moment';
import httpStatus from 'http-status';
import config from '#config/index';
import ApiError from '#utils/ApiError';
import { type Token, TokenType, type User } from '@prisma/client';
import type { AuthTokensResponse } from '#types/response';
import { BaseService } from '#core/base/BaseService';

export class TokenService extends BaseService {
  private generateToken(
    userId: string,
    expires: Moment,
    type: TokenType,
    extra?: object,
  ): string {
    const secret = config.jwt.secret;

    const payload = {
      sub: userId,
      iat: moment().unix(),
      exp: expires.unix(),
      type,
      ...extra,
    };

    return jwt.sign(payload, secret);
  }

  private async saveToken(
    token: string,
    userId: string,
    expires: Moment,
    type: TokenType,
    blacklisted = false,
  ): Promise<Token> {
    return this.prisma.token.create({
      data: {
        token,
        userId,
        expiresAt: expires.toDate(),
        type,
        blacklisted,
      },
    });
  }

  private async revokeTokens(userId: string, type?: TokenType) {
    return this.prisma.token.deleteMany({
      where: {
        userId,
        type,
      },
    });
  }

  private verifyToken(token: string, type: TokenType, scope?: string) {
    let payload;
    try {
      // token expiry is checked here
      payload = jwt.verify(token, config.jwt.secret);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (ignored) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token');
    }

    /* c8 ignore next 3 */
    if (typeof payload === 'string') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token');
    }

    /* c8 ignore next 3 */
    if (payload.sub === undefined || typeof payload.sub !== 'string') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token sub');
    }

    if (payload.type !== type) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token type');
    }

    if (scope !== undefined && payload.scope !== scope) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token type');
    }

    return {
      ...payload,
      userId: payload.sub,
    };
  }

  async verifyDatabaseToken(token: string, type: TokenType): Promise<Token> {
    const payload = this.verifyToken(token, type);

    const userId = payload.sub;
    const tokenData = await this.prisma.token.findFirst({
      where: { token, type, userId, blacklisted: false },
    });

    if (!tokenData) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Invalid token');
    }

    return tokenData;
  }

  async generateAuthTokens(
    user: Pick<User, 'id' | 'role'>,
    remember = false,
  ): Promise<AuthTokensResponse> {
    const access = this.generateAccessToken(user);

    if (!remember) {
      return {
        ...access,
      };
    }

    const refresh = await this.generateRefreshToken(user);

    return {
      ...access,
      ...refresh,
    };
  }

  private generateAccessToken(user: Pick<User, 'id' | 'role'>) {
    const accessTokenExpires = moment().add(
      config.jwt.accessExpirationMinutes,
      'minutes',
    );

    const token = this.generateToken(
      user.id,
      accessTokenExpires,
      TokenType.ACCESS,
      {
        role: user.role,
      },
    );

    return {
      access: {
        token,
        expires: accessTokenExpires.toDate(),
      },
    };
  }

  private async generateRefreshToken(user: Pick<User, 'id'>) {
    const refreshTokenExpires = moment().add(
      config.jwt.refreshExpirationDays,
      'days',
    );
    const refreshToken = this.generateToken(
      user.id,
      refreshTokenExpires,
      TokenType.REFRESH,
    );

    await this.saveToken(
      refreshToken,
      user.id,
      refreshTokenExpires,
      TokenType.REFRESH,
    );

    return {
      refresh: {
        token: refreshToken,
        expires: refreshTokenExpires.toDate(),
      },
    };
  }

  async generateResetPasswordToken(
    userId: string,
  ): Promise<string | undefined> {
    const expires = moment().add(
      config.jwt.resetPasswordExpirationMinutes,
      'minutes',
    );
    const type = TokenType.RESET_PASSWORD;
    const resetPasswordToken = this.generateToken(userId, expires, type);
    await this.revokeTokens(userId, type);
    await this.saveToken(resetPasswordToken, userId, expires, type);

    return resetPasswordToken;
  }

  async generateVerifyEmailToken(user: Pick<User, 'id'>): Promise<string> {
    const expires = moment().add(
      config.jwt.verifyEmailExpirationMinutes,
      'minutes',
    );
    const type = TokenType.VERIFY_EMAIL;
    const verifyEmailToken = this.generateToken(user.id, expires, type);
    await this.revokeTokens(user.id, type);
    await this.saveToken(verifyEmailToken, user.id, expires, type);

    return verifyEmailToken;
  }

  generateTotpToken(user: Pick<User, 'id'>) {
    const expires = moment().add(5, 'minutes');
    return this.generateToken(user.id, expires, TokenType.RESTRICTED_ACCESS, {
      scope: 'OTP',
    });
  }

  generateSendVerifyEmailToken(user: Pick<User, 'id'>) {
    const expires = moment().add(5, 'minutes');
    return this.generateToken(user.id, expires, TokenType.RESTRICTED_ACCESS, {
      scope: 'SEND_VERIFY_EMAIL',
    });
  }

  verifyTotpToken(token: string) {
    return this.verifyToken(token, TokenType.RESTRICTED_ACCESS, 'OTP');
  }

  verifySendVerifyEmailToken(token: string) {
    return this.verifyToken(
      token,
      TokenType.RESTRICTED_ACCESS,
      'SEND_VERIFY_EMAIL',
    );
  }

  async blacklistTokens(userId: string): Promise<void> {
    await this.prisma.token.updateMany({
      data: {
        blacklisted: true,
      },
      where: { userId },
    });
  }

  async deleteExpiredTokens() {
    const refDate = moment().subtract(1, 'hour').toDate();

    return this.prisma.token.deleteMany({
      where: {
        expiresAt: {
          lte: refDate,
        },
      },
    });
  }

  deleteTokenById = async (id: number) => {
    await this.prisma.token.delete({ where: { id } });
  };
}

export default new TokenService();
