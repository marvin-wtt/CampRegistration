import httpStatus from 'http-status';
import userService from '#app/user/user.service';
import tokenService from '#app/token/token.service';
import notificationService from '#app/notification/notification.service';
import ApiError from '#utils/ApiError';
import { TokenType } from '@prisma/client';
import { encryptPassword, isPasswordMatch } from '#utils/encryption';
import { AuthTokensResponse } from '#types/response';
import prisma from '#/client.js';
import i18n, { t } from '#core/i18n';

const loginWithEmailPassword = async (email: string, password: string) => {
  const user = await userService.getUserByEmail(email);

  if (!user || !(await isPasswordMatch(password, user.password as string))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Incorrect email or password.');
  }

  if (user.locked) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Account is locked');
  }

  return user;
};

const logout = async (refreshToken: string): Promise<void> => {
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
    const refreshTokenData = await tokenService.verifyDatabaseToken(
      refreshToken,
      TokenType.REFRESH,
    );
    const { id, userId } = refreshTokenData;

    await tokenService.deleteTokenById(id);

    await userService.updateUserLastSeenById(userId);

    // Fetch user because role is required
    const user = await userService.getUserByIdOrFail(userId);

    return tokenService.generateAuthTokens(user, true);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

const resetPassword = async (
  token: string,
  email: string,
  password: string,
): Promise<void> => {
  const resetPasswordTokenData = await tokenService.verifyDatabaseToken(
    token,
    TokenType.RESET_PASSWORD,
  );
  const user = await userService.getUserById(resetPasswordTokenData.userId);
  if (!user || user.email !== email) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token');
  }
  await userService.updateUserById(user.id, {
    password,
    emailVerified: true,
  });

  await revokeAllUserTokens(user.id);
};

const revokeAllUserTokens = async (userId: string) => {
  await tokenService.blacklistTokens(userId);
};

const verifyEmail = async (token: string): Promise<void> => {
  let verifyEmailTokenData;
  try {
    verifyEmailTokenData = await tokenService.verifyDatabaseToken(
      token,
      TokenType.VERIFY_EMAIL,
    );
  } catch (e: unknown) {
    // Change status code of api error
    if (e instanceof ApiError) {
      e.statusCode = httpStatus.UNAUTHORIZED;
    }
    throw e;
  }

  await prisma.token.deleteMany({
    where: {
      userId: verifyEmailTokenData.userId,
      type: TokenType.VERIFY_EMAIL,
    },
  });

  await userService.updateUserById(verifyEmailTokenData.userId, {
    emailVerified: true,
  });
};

const sendResetPasswordEmail = async (to: string, token: string) => {
  const user = await userService.getUserByEmail(to);
  await i18n.changeLanguage(user?.locale);

  const template = 'reset-password';
  const subject = t('auth:email.resetPassword.subject');
  const url = notificationService.generateUrl('reset-password', {
    email: to,
    token,
  });

  const context = {
    url,
  };

  await notificationService.sendEmail({
    to,
    subject,
    template,
    context,
  });
};

const sendVerificationEmail = async (to: string, token: string) => {
  const user = await userService.getUserByEmail(to);
  await i18n.changeLanguage(user?.locale);

  const subject = t('auth:email.verifyEmail.subject');
  const url = notificationService.generateUrl('login', {
    email: to,
    token,
  });

  const context = {
    url,
  };

  const template = 'verify-email';

  await notificationService.sendEmail({
    to,
    subject,
    template,
    context,
  });
};

export default {
  loginWithEmailPassword,
  isPasswordMatch,
  encryptPassword,
  logout,
  revokeAllUserTokens,
  refreshAuth,
  resetPassword,
  verifyEmail,
  sendVerificationEmail,
  sendResetPasswordEmail,
};
