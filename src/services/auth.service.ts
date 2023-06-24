import httpStatus from "http-status";
import userService from "./user.service";
import ApiError from "../utils/ApiError";
import { TokenType } from "@prisma/client";
import { encryptPassword, isPasswordMatch } from "../utils/encryption";
import exclude from "../utils/exclude";
import { AuthTokensResponse } from "../types/response";
import tokenService from "./token.service";
import prisma from "../client";

const loginUserWithEmailAndPassword = async (
  email: string,
  password: string
) => {
  const user = await userService.getUserByEmailWithCamps(email);

  if (!user || !(await isPasswordMatch(password, user.password as string))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect email or password");
  }

  return exclude(user, ["password"]);
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise<void>}
 */
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

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<AuthTokensResponse>}
 */
const refreshAuth = async (
  refreshToken: string
): Promise<AuthTokensResponse> => {
  try {
    const refreshTokenData = await tokenService.verifyToken(
      refreshToken,
      TokenType.REFRESH
    );
    const { userId } = refreshTokenData;
    await prisma.token.delete({ where: { id: refreshTokenData.id } });

    return tokenService.generateAuthTokens({ id: userId });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
const resetPassword = async (
  resetPasswordToken: string,
  newPassword: string
): Promise<void> => {
  try {
    const resetPasswordTokenData = await tokenService.verifyToken(
      resetPasswordToken,
      TokenType.RESET_PASSWORD
    );
    const user = await userService.getUserById(resetPasswordTokenData.userId);
    if (!user) {
      throw new Error();
    }
    const encryptedPassword = await encryptPassword(newPassword);
    await userService.updateUserById(user.id, { password: encryptedPassword });
    await prisma.token.deleteMany({
      where: { userId: user.id, type: TokenType.RESET_PASSWORD },
    });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Password reset failed");
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise<void>}
 */
const verifyEmail = async (verifyEmailToken: string): Promise<void> => {
  try {
    const verifyEmailTokenData = await tokenService.verifyToken(
      verifyEmailToken,
      TokenType.VERIFY_EMAIL
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
