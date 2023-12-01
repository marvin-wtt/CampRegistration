import httpStatus from "http-status";
import userService from "./user.service";
import ApiError from "../utils/ApiError";
import { TokenType } from "@prisma/client";
import { encryptPassword, isPasswordMatch } from "@/utils/encryption";
import exclude from "../utils/exclude";
import { AuthTokensResponse } from "@/types/response";
import tokenService from "./token.service";
import prisma from "../client";

const loginUserWithEmailAndPassword = async (
  email: string,
  password: string,
) => {
  const user = await userService.getUserByEmailWithCamps(email);

  if (!user || !(await isPasswordMatch(password, user.password as string))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect email or password.");
  }

  if (!user.emailVerified) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Please confirm your email to login.",
    );
  }

  return exclude(user, ["password"]);
};

const logout = async (refreshToken: string): Promise<void> => {
  const refreshTokenData = await prisma.token.findFirst({
    where: {
      token: refreshToken,
      type: TokenType.REFRESH,
      blacklisted: false,
    },
  });
  if (!refreshTokenData) {
    return;
  }
  await prisma.token.delete({ where: { id: refreshTokenData.id } });
};

const refreshAuth = async (
  refreshToken: string,
): Promise<AuthTokensResponse> => {
  try {
    const refreshTokenData = await tokenService.verifyToken(
      refreshToken,
      TokenType.REFRESH,
    );
    const { userId } = refreshTokenData;
    await prisma.token.delete({ where: { id: refreshTokenData.id } });

    return tokenService.generateAuthTokens({ id: userId }, true);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
  }
};

const resetPassword = async (
  token: string,
  email: string,
  password: string,
): Promise<void> => {
  const resetPasswordTokenData = await tokenService.verifyToken(
    token,
    TokenType.RESET_PASSWORD,
  );
  const user = await userService.getUserById(resetPasswordTokenData.userId);
  if (!user || user.email !== email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid token");
  }
  const encryptedPassword = await encryptPassword(password);
  await userService.updateUserById(user.id, {
    password: encryptedPassword,
    emailVerified: true,
  });

  await logoutAllDevices(user.id);
};

const logoutAllDevices = async (userId: string) => {
  return prisma.token.deleteMany({
    where: {
      OR: [
        {
          userId,
          type: TokenType.RESET_PASSWORD,
        },
        {
          userId,
          type: TokenType.ACCESS,
        },
        {
          userId,
          type: TokenType.REFRESH,
        },
      ],
    },
  });
};

const verifyEmail = async (token: string): Promise<void> => {
  try {
    const verifyEmailTokenData = await tokenService.verifyToken(
      token,
      TokenType.VERIFY_EMAIL,
    );
    await prisma.token.deleteMany({
      where: {
        userId: verifyEmailTokenData.userId,
        type: TokenType.VERIFY_EMAIL,
      },
    });
    await userService.updateUserById(verifyEmailTokenData.userId, {
      emailVerified: true,
    });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Email verification failed");
  }
};

export default {
  loginUserWithEmailAndPassword,
  isPasswordMatch,
  encryptPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
};
