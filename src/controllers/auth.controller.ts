import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import {
  authService,
  userService,
  tokenService,
  emailService,
} from "../services";
import exclude from "../utils/exclude";
import { User } from "@prisma/client";
import { Request, Response } from "express";
import { AuthTokensResponse } from "../types/response";
import config from "../config";
import {userCampResource} from "../resources";

const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await userService.createUser({
    name: name,
    email: email,
    password: password,
  });
  const userWithoutPassword = exclude(user, [
    "password",
    "createdAt",
    "updatedAt",
  ]);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user: userWithoutPassword, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password, remember } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user, remember);

  setAuthCookies(res, tokens);

  const camps = user.camps.map((value) => {
    return value.camp;
  });

  const response = userCampResource(user, camps);
  res.send({ user: response, tokens });
});

const logout = async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);

  destroyAuthCookies(res);

  res.status(httpStatus.NO_CONTENT).send();
};

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);

  destroyAuthCookies(res)
  setAuthCookies(res, tokens);

  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(
    req.body.email
  );
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token as string, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const user = req.user as User;
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
  await emailService.sendVerificationEmail(user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token as string);
  res.status(httpStatus.NO_CONTENT).send();
});

const setAuthCookies = (res: Response, tokens: AuthTokensResponse) => {
  const httpOnly = true;
  const secure = config.env !== "development";
  const sameSite = "strict";

  res.cookie("accessToken", tokens.access.token, {
    httpOnly: httpOnly,
    secure: secure,
    expires: tokens.access.expires,
    sameSite: sameSite,
  });

  if (tokens.refresh) {
    res.cookie("refreshToken", tokens.refresh.token, {
      httpOnly: httpOnly,
      secure: secure,
      expires: tokens.refresh.expires,
      sameSite: sameSite,
    });
  }
};

const destroyAuthCookies = (res: Response) => {
  // TODO
}

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
