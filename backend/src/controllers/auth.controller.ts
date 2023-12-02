import httpStatus from "http-status";
import { catchRequestAsync } from "@/utils/catchAsync";
import {
  authService,
  userService,
  tokenService,
  notificationService,
} from "@/services";
import { Request, Response } from "express";
import { AuthTokensResponse } from "@/types/response";
import config from "@/config";
import { userCampResource, userDetailedResource } from "@/resources";
import ApiError from "@/utils/ApiError";
import managerService from "@/services/manager.service";
import { requestLocale } from "@/utils/requestLocale";
import { authUserId } from "@/utils/authUserId";

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
  notificationService.sendVerificationEmail(user.email, verifyEmailToken);

  res.status(httpStatus.CREATED).json(userDetailedResource(user));
});

const login = catchRequestAsync(async (req, res) => {
  const { email, password, remember } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user, remember);

  setAuthCookies(res, tokens);

  const camps = user.camps.map((value) => {
    return value.camp;
  });

  const response = userCampResource(user, camps);

  res.json({ user: response, tokens });
});

const logout = catchRequestAsync(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);

  destroyAuthCookies(res);

  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchRequestAsync(async (req, res) => {
  const refreshToken = req.body.refreshToken ?? extractCookieRefreshToken(req);

  if (!refreshToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing refresh token");
  }

  const tokens = await authService.refreshAuth(refreshToken);
  destroyAuthCookies(res);
  setAuthCookies(res, tokens);

  res.json({ ...tokens });
});

const extractCookieRefreshToken = (req: Request) => {
  if (req && req.signedCookies && "refreshToken" in req.signedCookies) {
    return req.signedCookies.refreshToken;
  }
  if (req && req.cookies && "refreshToken" in req.cookies) {
    return req.cookies.refreshToken;
  }
  return null;
};

const forgotPassword = catchRequestAsync(async (req, res) => {
  const { email } = req.body;
  const resetPasswordToken =
    await tokenService.generateResetPasswordToken(email);
  if (resetPasswordToken === undefined) {
    res.status(httpStatus.NO_CONTENT).send();
    return;
  }
  notificationService.sendResetPasswordEmail(email, resetPasswordToken);
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
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid auth state");
  }

  const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
  notificationService.sendVerificationEmail(user.email, verifyEmailToken);
  res.sendStatus(httpStatus.NO_CONTENT);
});

const verifyEmail = catchRequestAsync(async (req, res) => {
  const { token } = req.body;

  await authService.verifyEmail(token);
  res.sendStatus(httpStatus.NO_CONTENT);
});

const setAuthCookies = (res: Response, tokens: AuthTokensResponse) => {
  const httpOnly = true;
  const secure = config.env !== "development";
  const sameSite = "strict";
  const path = "/";

  res.cookie("accessToken", tokens.access.token, {
    httpOnly,
    secure,
    path,
    expires: tokens.access.expires,
    sameSite,
  });

  if (tokens.refresh) {
    res.cookie("refreshToken", tokens.refresh.token, {
      httpOnly,
      secure,
      path,
      expires: tokens.refresh.expires,
      sameSite,
    });
  }
};

const destroyAuthCookies = (res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
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
