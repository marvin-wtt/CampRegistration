import httpStatus from 'http-status';
import { AuthService } from './auth.service.js';
import { UserService } from '#app/user/user.service';
import { TokenService } from '#app/token/token.service';
import { type Request, type Response } from 'express';
import type { AuthTokensResponse } from '#types/response';
import type { AppConfig } from '#config';
import ApiError from '#utils/ApiError';
import { CampManagerService } from '#app/campManager/camp-manager.service.js';
import authResource from './auth.resource.js';
import validator from './auth.validation.js';
import { TotpService } from '#app/totp/totp.service';
import {
  ResetPasswordMessage,
  VerifyEmailMessage,
} from '#app/auth/auth.messages';
import { BaseController } from '#core/base/BaseController';
import { inject, injectable } from 'inversify';
import { Config } from '#core/ioc/decorators';
import { secureCookieOptions } from '#utils/cookie';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '#app/auth/auth.cookies';

@injectable()
export class AuthController extends BaseController {
  constructor(
    @Config() private readonly config: AppConfig,
    @inject(AuthService) private readonly authService: AuthService,
    @inject(UserService) private readonly userService: UserService,
    @inject(CampManagerService)
    private readonly managerService: CampManagerService,
    @inject(TokenService) private readonly tokenService: TokenService,
    @inject(TotpService) private readonly totpService: TotpService,
  ) {
    super();
  }

  async register(req: Request, res: Response) {
    const {
      body: { name, email, password },
    } = await req.validate(validator.register);
    const locale = req.preferredLocale();

    const user = await this.userService.createUser({
      name,
      email,
      password,
      locale,
    });

    await this.managerService.resolveManagerInvitations(user.email, user.id);

    const verifyEmailToken =
      await this.tokenService.generateVerifyEmailToken(user);
    await VerifyEmailMessage.enqueue({
      user,
      token: verifyEmailToken,
    });

    res.status(httpStatus.CREATED).json({
      name: user.name,
      email: user.email,
      locale: user.locale,
    });
  }

  async login(req: Request, res: Response) {
    const {
      body: { email, password, remember },
    } = await req.validate(validator.login);

    const user = await this.authService.loginWithEmailPassword(email, password);

    // Check if totp is required
    if (user.twoFactorEnabled) {
      const token = this.tokenService.generateTotpToken(user);
      // Set auth header
      res.setHeader(
        'WWW-Authenticate',
        `OTP realm="${this.config.appName}", charset="UTF-8"`,
      );

      this.sendPartialAuthResponse(res, token, 'TOTP_REQUIRED');
      return;
    }

    // Check if email is required
    if (!user.emailVerified) {
      const token = this.tokenService.generateSendVerifyEmailToken(user);

      this.sendPartialAuthResponse(res, token, 'EMAIL_NOT_VERIFIED');
      return;
    }

    await this.sendAuthResponse(req, res, user.id, remember);
  }

  async verifyOTP(req: Request, res: Response) {
    const {
      body: { otp, token, remember },
    } = await req.validate(validator.verifyOTP);

    const { userId } = this.tokenService.verifyTotpToken(token);
    const user = await this.userService.getUserByIdOrFail(userId);
    this.totpService.verifyTOTP(user, otp);

    await this.sendAuthResponse(req, res, userId, remember);
  }

  async sendAuthResponse(
    req: Request,
    res: Response,
    userId: string,
    remember: boolean,
  ) {
    const user = await this.userService.updateUserLastSeenByIdWithCamps(userId);

    const tokens = await this.tokenService.generateAuthTokens(user, remember);

    this.setAuthCookies(req, res, tokens);

    res.json(
      authResource({
        user,
        tokens,
      }),
    );
  }

  sendPartialAuthResponse(res: Response, token: string, type: string) {
    res.status(httpStatus.FORBIDDEN).send({
      status: 'PARTIAL_AUTH',
      partialAuthType: type,
      token,
    });
  }

  async logout(req: Request, res: Response) {
    const { body } = await req.validate(validator.logout);
    const refreshToken =
      body.refreshToken ?? this.extractCookieRefreshToken(req);

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    this.destroyAuthCookies(res);

    res.status(httpStatus.NO_CONTENT).send();
  }

  async refreshTokens(req: Request, res: Response) {
    const { body } = await req.validate(validator.refreshTokens);

    const refreshToken =
      body.refreshToken ?? this.extractCookieRefreshToken(req);

    if (!refreshToken) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Missing refresh token');
    }

    const tokens = await this.authService.refreshAuth(refreshToken);
    this.destroyAuthCookies(res);
    this.setAuthCookies(req, res, tokens);

    res.json({ ...tokens });
  }

  extractCookieRefreshToken(req: Request): string | null {
    const cookies: unknown = req.cookies;
    if (
      cookies &&
      typeof cookies === 'object' &&
      REFRESH_TOKEN_COOKIE in cookies &&
      typeof cookies[REFRESH_TOKEN_COOKIE] === 'string'
    ) {
      return cookies[REFRESH_TOKEN_COOKIE];
    }

    return null;
  }

  async forgotPassword(req: Request, res: Response) {
    const {
      body: { email },
    } = await req.validate(validator.forgotPassword);

    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      // No not throw error so that it's not possible to check wherever a user
      //  exists by abusing this function.
      res.sendStatus(httpStatus.NO_CONTENT);
      return;
    }

    const resetPasswordToken =
      await this.tokenService.generateResetPasswordToken(user.id);

    if (resetPasswordToken !== undefined) {
      await ResetPasswordMessage.send({
        user,
        token: resetPasswordToken,
      });
    }

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  async resetPassword(req: Request, res: Response) {
    const {
      body: { password, token, email },
    } = await req.validate(validator.resetPassword);

    await this.authService.resetPassword(token, email, password);

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  async sendVerificationEmail(req: Request, res: Response) {
    const {
      body: { token },
    } = await req.validate(validator.sendEmailVerification);

    const { userId } = this.tokenService.verifySendVerifyEmailToken(token);
    const user = await this.userService.getUserByIdOrFail(userId);

    if (user.emailVerified) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already verified');
    }

    const verifyEmailToken =
      await this.tokenService.generateVerifyEmailToken(user);
    await VerifyEmailMessage.enqueue({
      user,
      token: verifyEmailToken,
    });

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  async verifyEmail(req: Request, res: Response) {
    const {
      body: { token },
    } = await req.validate(validator.verifyEmail);

    await this.authService.verifyEmail(token);

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  setAuthCookies(req: Request, res: Response, tokens: AuthTokensResponse) {
    if (req.headers['x-client-type'] !== 'web') {
      return;
    }

    res.cookie(
      ACCESS_TOKEN_COOKIE,
      tokens.access.token,
      secureCookieOptions({ expires: tokens.access.expires }),
    );

    if (tokens.refresh) {
      res.cookie(
        REFRESH_TOKEN_COOKIE,
        tokens.refresh.token,
        secureCookieOptions({ expires: tokens.refresh.expires }),
      );
    }
  }

  destroyAuthCookies = (res: Response) => {
    res.clearCookie(ACCESS_TOKEN_COOKIE);
    res.clearCookie(REFRESH_TOKEN_COOKIE);
  };

  getCsrfToken(req: Request, res: Response) {
    if (!req.csrfToken) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to generate CSRF Token',
      );
    }

    const csrfToken = req.csrfToken();

    res.json({ csrfToken });
  }
}
