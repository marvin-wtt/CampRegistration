import httpStatus from 'http-status';
import { catchRequestAsync } from 'utils/catchAsync';
import authService from './auth.service';
import userService from 'app/user/user.service';
import tokenService from 'app/token/token.service';
import { Request, Response } from 'express';
import { AuthTokensResponse } from 'types/response';
import config from 'config';
import profileResource from 'app/profile/profile.resource';
import ApiError from 'utils/ApiError';
import managerService from 'app/manager/manager.service';
import { requestLocale } from 'utils/requestLocale';
import { authUserId } from 'utils/authUserId';
import { catchAndResolve } from 'utils/promiseUtils';
import authResource from './auth.resource';

const register = catchRequestAsync(async (req, res) => {
  const { name, email, password } = req.body;
  const locale = requestLocale(req);

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
});

const login = catchRequestAsync(async (req, res) => {
  const { email, password, remember } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user, remember);

  setAuthCookies(res, tokens);

  const camps = user.camps.map((value) => {
    return value.camp;
  });
  const profile = profileResource(user, camps);

  res.json(authResource(profile, tokens));
});

const logout = catchRequestAsync(async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken ?? extractCookieRefreshToken(req);

  await authService.logout(refreshToken);

  destroyAuthCookies(res);

  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchRequestAsync(async (req, res) => {
  const refreshToken = req.body.refreshToken ?? extractCookieRefreshToken(req);

  if (!refreshToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing refresh token');
  }

  const tokens = await authService.refreshAuth(refreshToken);
  destroyAuthCookies(res);
  setAuthCookies(res, tokens);

  res.json({ ...tokens });
});

const extractCookieRefreshToken = (req: Request) => {
  if (req && req.cookies && 'refreshToken' in req.cookies) {
    return req.cookies.refreshToken;
  }

  return null;
};

const forgotPassword = catchRequestAsync(async (req, res) => {
  const { email } = req.body;

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
});

const resetPassword = catchRequestAsync(async (req, res) => {
  const { password, token, email } = req.body;
  await authService.resetPassword(token, email, password);

  res.sendStatus(httpStatus.NO_CONTENT);
});

const sendVerificationEmail = catchRequestAsync(async (req, res) => {
  const userId = authUserId(req);
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid auth state');
  }

  if (user.emailVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already verified');
  }

  const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
  await authService.sendVerificationEmail(user.email, verifyEmailToken);

  res.sendStatus(httpStatus.NO_CONTENT);
});

const verifyEmail = catchRequestAsync(async (req, res) => {
  const { token } = req.body;

  await authService.verifyEmail(token);

  res.sendStatus(httpStatus.NO_CONTENT);
});

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
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
};
