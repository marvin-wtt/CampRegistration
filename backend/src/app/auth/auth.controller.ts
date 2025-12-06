import httpStatus from 'http-status';
import authService from './auth.service.js';
import userService from '#app/user/user.service';
import tokenService from '#app/token/token.service';
import { type Request, type Response } from 'express';
import type { AuthTokensResponse } from '#types/response';
import config from '#config/index';
import ApiError from '#utils/ApiError';
import managerService from '#app/manager/manager.service';
import authResource from './auth.resource.js';
import validator from './auth.validation.js';
import totpService from '#app/totp/totp.service';
import {
  ResetPasswordMessage,
  VerifyEmailMessage,
} from '#app/auth/auth.messages';
import { BaseController } from '#core/base/BaseController';

class AuthController extends BaseController {
  async register(req: Request, res: Response) {
    const {
      body: { name, email, password },
    } = await req.validate(validator.register);
    const locale = req.preferredLocale();

    const user = await userService.createUser({
      name,
      email,
      password,
      locale,
    });

    await managerService.resolveManagerInvitations(user.email, user.id);

    const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
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

    const user = await authService.loginWithEmailPassword(email, password);

    // Check if totp is required
    if (user.twoFactorEnabled) {
      const token = tokenService.generateTotpToken(user);
      // Set auth header
      res.setHeader(
        'WWW-Authenticate',
        `OTP realm="${config.appName}", charset="UTF-8"`,
      );

      this.sendPartialAuthResponse(res, token, 'TOTP_REQUIRED');
      return;
    }

    // Check if email is required
    if (!user.emailVerified) {
      const token = tokenService.generateSendVerifyEmailToken(user);

      this.sendPartialAuthResponse(res, token, 'EMAIL_NOT_VERIFIED');
      return;
    }

    await this.sendAuthResponse(res, user.id, remember);
  }

  async verifyOTP(req: Request, res: Response) {
    const {
      body: { otp, token, remember },
    } = await req.validate(validator.verifyOTP);

    const { userId } = tokenService.verifyTotpToken(token);
    const user = await userService.getUserByIdOrFail(userId);
    totpService.verifyTOTP(user, otp);

    await this.sendAuthResponse(res, userId, remember);
  }

  async sendAuthResponse(res: Response, userId: string, remember: boolean) {
    const user = await userService.updateUserLastSeenByIdWithCamps(userId);

    const tokens = await tokenService.generateAuthTokens(user, remember);
    this.setAuthCookies(res, tokens);

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
      await authService.logout(refreshToken);
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

    const tokens = await authService.refreshAuth(refreshToken);
    this.destroyAuthCookies(res);
    this.setAuthCookies(res, tokens);

    res.json({ ...tokens });
  }

  extractCookieRefreshToken(req: Request): string | null {
    const cookies: unknown = req.cookies;
    if (
      cookies &&
      typeof cookies === 'object' &&
      'refreshToken' in cookies &&
      typeof cookies.refreshToken === 'string'
    ) {
      return cookies.refreshToken;
    }

    return null;
  }

  async forgotPassword(req: Request, res: Response) {
    const {
      body: { email },
    } = await req.validate(validator.forgotPassword);

    const user = await userService.getUserByEmail(email);
    if (!user) {
      // No not throw error so that it's not possible to check wherever a user
      //  exists by abusing this function.
      res.sendStatus(httpStatus.NO_CONTENT);
      return;
    }

    const resetPasswordToken = await tokenService.generateResetPasswordToken(
      user.id,
    );

    if (resetPasswordToken !== undefined) {
      await ResetPasswordMessage.enqueue({
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

    await authService.resetPassword(token, email, password);

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  async sendVerificationEmail(req: Request, res: Response) {
    const {
      body: { token },
    } = await req.validate(validator.sendEmailVerification);

    const { userId } = tokenService.verifySendVerifyEmailToken(token);
    const user = await userService.getUserByIdWithCamps(userId);

    if (user.emailVerified) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already verified');
    }

    const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
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

    await authService.verifyEmail(token);

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  setAuthCookies(res: Response, tokens: AuthTokensResponse) {
    const httpOnly = true;
    const secure = config.env !== 'development';
    const sameSite = 'strict';
    const path = '/';

    res.cookie('accessToken', tokens.access.token, {
      httpOnly,
      secure,
      path,
      expires: tokens.access.expires,
      sameSite,
    });

    if (tokens.refresh) {
      res.cookie('refreshToken', tokens.refresh.token, {
        httpOnly,
        secure,
        path,
        expires: tokens.refresh.expires,
        sameSite,
      });
    }
  }

  destroyAuthCookies = (res: Response) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
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

export default new AuthController();
