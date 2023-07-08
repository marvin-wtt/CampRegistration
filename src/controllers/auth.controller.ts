import httpStatus from "http-status";
import { catchRequestAsync } from "../utils/catchAsync";
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
import { userCampResource } from "../resources";
import ApiError from "../utils/ApiError";
import getUserLocale from "get-user-locale";

const register = catchRequestAsync(async (req, res) => {
  const { name, email, password } = req.body
  const locale = getUserLocale();

  const user = await userService.createUser({
    name,
    email,
    password,
    locale,
  });
  const userWithoutPassword = exclude(user, [
    "password",
    "createdAt",
    "updatedAt",
  ]);
  res.status(httpStatus.CREATED).json(userWithoutPassword);
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
  res.send({ user: response, tokens });
});

const logout = async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);

  destroyAuthCookies(res);

  res.status(httpStatus.NO_CONTENT).send();
};

const refreshTokens = catchRequestAsync(async (req, res) => {
  const refreshToken = req.body.refreshToken ?? extractCookieRefreshToken(req);

  if (!refreshToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing refresh token");
  }

  const tokens = await authService.refreshAuth(refreshToken);
  destroyAuthCookies(res);
  setAuthCookies(res, tokens);

  res.send({ ...tokens });
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
  const resetPasswordToken = await tokenService.generateResetPasswordToken(
    req.body.email
  );
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchRequestAsync(async (req, res) => {
  await authService.resetPassword(req.query.token as string, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchRequestAsync(async (req, res) => {
  const user = req.user as User;
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
  await emailService.sendVerificationEmail(user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchRequestAsync(async (req, res) => {
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
