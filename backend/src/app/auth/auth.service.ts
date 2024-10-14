import httpStatus from 'http-status';
import userService from 'app/user/user.service';
import tokenService from 'app/token/token.service';
import notificationService from 'app/notification/notification.service';
import ApiError from 'utils/ApiError';
import { TokenType } from '@prisma/client';
import { encryptPassword, isPasswordMatch } from 'utils/encryption';
import { AuthTokensResponse } from 'types/response';
import prisma from 'client';
import i18n, { t } from 'config/i18n';

const loginUserWithEmailAndPassword = async (
  email: string,
  password: string,
) => {
  const user = await userService.getUserByEmail(email);

  if (!user || !(await isPasswordMatch(password, user.password as string))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Incorrect email or password.');
  }

  if (user.locked) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Account is locked');
  }

  if (!user.emailVerified) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Please confirm your email to login.',
    );
  }

  return await userService.updateUserLastSeenByIdWithCamps(user.id);
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

    await tokenService.deleteTokenById(id);

    // Fetch user because role is required
    const user = await userService.getUserById(userId);
    if (!user) {
      // noinspection ExceptionCaughtLocallyJS
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Token not found');
    }

    await userService.updateUserLastSeenById(userId);

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
  const resetPasswordTokenData = await tokenService.verifyToken(
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

  await logoutAllDevices(user.id);
};

const logoutAllDevices = async (userId: string) => {
  await tokenService.blacklistTokens(userId);
};

const verifyEmail = async (token: string): Promise<void> => {
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
