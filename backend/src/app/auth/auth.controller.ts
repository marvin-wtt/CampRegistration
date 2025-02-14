import httpStatus from 'http-status';
import authService from './auth.service.js';
import userService from '#app/user/user.service';
import tokenService from '#app/token/token.service';
import { type Request, type Response } from 'express';
import type { AuthTokensResponse } from '#types/response';
import config from '#config/index';
import profileResource from '#app/profile/profile.resource';
import ApiError from '#utils/ApiError';
import managerService from '#app/manager/manager.service';
import { catchAndResolve } from '#utils/promiseUtils';
import authResource from './auth.resource.js';
import validator from './auth.validation.js';
import totpService from '#app/totp/totp.service.js';

const register = async (req: Request, res: Response) => {
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
  await catchAndResolve(
    authService.sendVerificationEmail(user.email, verifyEmailToken),
  );

  res.status(httpStatus.CREATED).json({
    name: user.name,
    email: user.email,
    locale: user.locale,
  });
};

const login = async (req: Request, res: Response) => {
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

    sendPartialAuthResponse(res, token, 'TOTP_REQUIRED');
    return;
  }

  // Check if email is required
  if (!user.emailVerified) {
    const token = tokenService.generateSendVerifyEmailToken(user);

    sendPartialAuthResponse(res, token, 'EMAIL_NOT_VERIFIED');
    return;
  }

  await sendAuthResponse(res, user.id, remember);
};

const verifyOTP = async (req: Request, res: Response) => {
  const {
    body: { otp, token, remember },
  } = await req.validate(validator.verifyOTP);

  const { userId } = tokenService.verifyTotpToken(token);
  const user = await userService.getUserByIdWithCamps(userId);
  await totpService.verifyTOTP(user, otp);

  await sendAuthResponse(res, userId, remember);
};

const sendAuthResponse = async (
  res: Response,
  userId: string,
  remember: boolean,
) => {
  const user = await userService.updateUserLastSeenByIdWithCamps(userId);

  const tokens = await tokenService.generateAuthTokens(user, remember);
  setAuthCookies(res, tokens);

  // Generate response
  const profile = profileResource(
    user,
    user.camps.map((value) => value.camp),
  );

  res.json(authResource(profile, tokens));
};

const sendPartialAuthResponse = (
  res: Response,
  token: string,
  type: string,
) => {
  res.status(httpStatus.FORBIDDEN).send({
    status: 'PARTIAL_AUTH',
    partialAuthType: type,
    token,
  });
};

const logout = async (req: Request, res: Response) => {
  const { body } = await req.validate(validator.logout);
  const refreshToken = body.refreshToken ?? extractCookieRefreshToken(req);

  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  destroyAuthCookies(res);

  res.status(httpStatus.NO_CONTENT).send();
};

const refreshTokens = async (req: Request, res: Response) => {
  const { body } = await req.validate(validator.refreshTokens);

  const refreshToken = body.refreshToken ?? extractCookieRefreshToken(req);

  if (!refreshToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing refresh token');
  }

  const tokens = await authService.refreshAuth(refreshToken);
  destroyAuthCookies(res);
  setAuthCookies(res, tokens);

  res.json({ ...tokens });
};

const extractCookieRefreshToken = (req: Request): string | null => {
  if (
    req.cookies &&
    'refreshToken' in req.cookies &&
    typeof req.cookies.refreshToken === 'string'
  ) {
    return req.cookies.refreshToken;
  }

  return null;
};

const forgotPassword = async (req: Request, res: Response) => {
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
    await authService.sendResetPasswordEmail(email, resetPasswordToken);
  }

  res.sendStatus(httpStatus.NO_CONTENT);
};

const resetPassword = async (req: Request, res: Response) => {
  const {
    body: { password, token, email },
  } = await req.validate(validator.resetPassword);

  await authService.resetPassword(token, email, password);

  res.sendStatus(httpStatus.NO_CONTENT);
};

const sendVerificationEmail = async (req: Request, res: Response) => {
  const {
    body: { token },
  } = await req.validate(validator.sendEmailVerification);

  const { userId } = tokenService.verifySendVerifyEmailToken(token);
  const user = await userService.getUserByIdWithCamps(userId);

  if (user.emailVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already verified');
  }

  const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
  await authService.sendVerificationEmail(user.email, verifyEmailToken);

  res.sendStatus(httpStatus.NO_CONTENT);
};

const verifyEmail = async (req: Request, res: Response) => {
  const {
    body: { token },
  } = await req.validate(validator.verifyEmail);

  await authService.verifyEmail(token);

  res.sendStatus(httpStatus.NO_CONTENT);
};

const setAuthCookies = (res: Response, tokens: AuthTokensResponse) => {
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
};

const destroyAuthCookies = (res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

export default {
  register,
  login,
  verifyOTP,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
};
