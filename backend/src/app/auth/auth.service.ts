import httpStatus from 'http-status';
import { UserService } from '#app/user/user.service';
import { TokenService } from '#app/token/token.service';
import ApiError from '#utils/ApiError';
import { TokenType } from '@prisma/client';
import { isPasswordMatch } from '#core/encryption';
import type { AuthTokensResponse } from '#types/response';
import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';

@injectable()
export class AuthService extends BaseService {
  constructor(
    @inject(UserService) private readonly userService: UserService,
    @inject(TokenService) private readonly tokenService: TokenService,
  ) {
    super();
  }

  async loginWithEmailPassword(email: string, password: string) {
    const user = await this.userService.getUserByEmail(email);

    if (!user || !(await isPasswordMatch(password, user.password))) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Incorrect email or password.',
      );
    }

    if (user.locked) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Account is locked');
    }

    return user;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.token.updateMany({
      data: {
        blacklisted: true,
      },
      where: {
        token: refreshToken,
        type: TokenType.REFRESH,
      },
    });
  }

  async refreshAuth(refreshToken: string): Promise<AuthTokensResponse> {
    try {
      const refreshTokenData = await this.tokenService.verifyDatabaseToken(
        refreshToken,
        TokenType.REFRESH,
      );
      const { id, userId } = refreshTokenData;

      await this.tokenService.deleteTokenById(id);

      await this.userService.updateUserLastSeenById(userId);

      // Fetch user because role is required
      const user = await this.userService.getUserByIdOrFail(userId);

      return await this.tokenService.generateAuthTokens(user, true);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }
  }

  async resetPassword(
    token: string,
    email: string,
    password: string,
  ): Promise<void> {
    const resetPasswordTokenData = await this.tokenService.verifyDatabaseToken(
      token,
      TokenType.RESET_PASSWORD,
    );
    const user = await this.userService.getUserById(
      resetPasswordTokenData.userId,
    );
    if (user?.email !== email) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token');
    }

    await this.userService.updateUserById(user.id, {
      password,
      emailVerified: true,
    });

    await this.revokeAllUserTokens(user.id);
  }

  async revokeAllUserTokens(userId: string) {
    await this.tokenService.blacklistTokens(userId);
  }

  async verifyEmail(token: string): Promise<void> {
    let verifyEmailTokenData;
    try {
      verifyEmailTokenData = await this.tokenService.verifyDatabaseToken(
        token,
        TokenType.VERIFY_EMAIL,
      );
    } catch (e: unknown) {
      // Change status code of api error
      if (e instanceof ApiError) {
        e.statusCode = httpStatus.UNAUTHORIZED;
      }
      throw e;
    }

    await this.prisma.token.deleteMany({
      where: {
        userId: verifyEmailTokenData.userId,
        type: TokenType.VERIFY_EMAIL,
      },
    });

    await this.userService.updateUserById(verifyEmailTokenData.userId, {
      emailVerified: true,
    });
  }
}
