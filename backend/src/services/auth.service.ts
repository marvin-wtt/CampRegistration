import httpStatus from "http-status";
import { userService, tokenService, notificationService } from "@/services";
import ApiError from "@/utils/ApiError";
import { TokenType } from "@prisma/client";
import { encryptPassword, isPasswordMatch } from "@/utils/encryption";
import exclude from "@/utils/exclude";
import { AuthTokensResponse } from "@/types/response";
import prisma from "@/client";
import { t, default as i18n } from "@/config/i18n";

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
  if (!refreshToken) {
    return;
  }

  await prisma.token.updateMany({
    data: {
      blacklisted: true,
    },
    where: {
      token: refreshToken,
      type: TokenType.REFRESH,
    },
  });
};

const refreshAuth = async (
  refreshToken: string,
): Promise<AuthTokensResponse> => {
  try {
    const refreshTokenData = await tokenService.verifyToken(
      refreshToken,
      TokenType.REFRESH,
    );
    const { id, userId } = refreshTokenData;
    await prisma.token.delete({ where: { id } });

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
  return prisma.token.updateMany({
    data: {
      blacklisted: true,
    },
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

const sendResetPasswordEmail = async (to: string, token: string) => {
  const user = await userService.getUserByEmail(to);
  await i18n.changeLanguage(user?.locale);

  const template = "reset-password";
  const subject = t("auth:email.reset-password.subject");
  const url = notificationService.generateUrl("reset-password", {
    email: to,
    token,
  });

  const context = {
    url,
  };

  notificationService.sendEmail({
    to,
    subject,
    template,
    context,
  });
};

const sendVerificationEmail = async (to: string, token: string) => {
  const user = await userService.getUserByEmail(to);
  await i18n.changeLanguage(user?.locale);

  const subject = t("email:auth.email-verification.subject");

  const url = notificationService.generateUrl("verify-email", {
    email: to,
    token,
  });

  const context = {
    url,
  };

  const template = "verify-email";

  notificationService.sendEmail({
    to,
    subject,
    template,
    context,
  });
};

export default {
  loginUserWithEmailAndPassword,
  isPasswordMatch,
  encryptPassword,
  logout,
  logoutAllDevices,
  refreshAuth,
  resetPassword,
  verifyEmail,
  sendVerificationEmail,
  sendResetPasswordEmail,
};
