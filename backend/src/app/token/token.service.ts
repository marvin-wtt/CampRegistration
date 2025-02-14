import jwt from 'jsonwebtoken';
import moment, { Moment } from 'moment';
import httpStatus from 'http-status';
import config from '#config/index';
import ApiError from '#utils/ApiError';
import { Token, TokenType, User } from '@prisma/client';
import prisma from '#client.js';
import { AuthTokensResponse } from '#types/response';

const generateToken = (
  userId: string,
  expires: Moment,
  type: TokenType,
  extra?: object,
): string => {
  const secret = config.jwt.secret;

  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
    ...extra,
  };

  return jwt.sign(payload, secret);
};

const saveToken = async (
  token: string,
  userId: string,
  expires: Moment,
  type: TokenType,
  blacklisted = false,
): Promise<Token> => {
  return prisma.token.create({
    data: {
      token,
      userId,
      expiresAt: expires.toDate(),
      type,
      blacklisted,
    },
  });
};

const revokeTokens = async (userId: string, type?: TokenType) => {
  return prisma.token.deleteMany({
    where: {
      userId,
      type,
    },
  });
};

const verifyToken = (token: string, type: TokenType, scope?: string) => {
  let payload;
  try {
    // token expiry is checked here
    payload = jwt.verify(token, config.jwt.secret);
  } catch (ignored) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token');
  }

  /* c8 ignore next 3 */
  if (typeof payload === 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token');
  }

  /* c8 ignore next 3 */
  if (payload.sub === undefined || typeof payload.sub !== 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token sub');
  }

  if (payload.type !== type) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token type');
  }

  if (scope !== undefined && payload.scope !== scope) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token type');
  }

  return {
    ...payload,
    userId: payload.sub,
  };
};

const verifyDatabaseToken = async (
  token: string,
  type: TokenType,
): Promise<Token> => {
  const payload = verifyToken(token, type);

  const userId = payload.sub;
  const tokenData = await prisma.token.findFirst({
    where: { token, type, userId, blacklisted: false },
  });

  if (!tokenData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Invalid token');
  }

  return tokenData;
};

const generateAuthTokens = async (
  user: Pick<User, 'id' | 'role'>,
  remember = false,
): Promise<AuthTokensResponse> => {
  const access = generateAccessToken(user);

  if (!remember) {
    return {
      ...access,
    };
  }

  const refresh = await generateRefreshToken(user);

  return {
    ...access,
    ...refresh,
  };
};

const generateAccessToken = (user: Pick<User, 'id' | 'role'>) => {
  const accessTokenExpires = moment().add(
    config.jwt.accessExpirationMinutes,
    'minutes',
  );

  const token = generateToken(user.id, accessTokenExpires, TokenType.ACCESS, {
    role: user.role,
  });

  return {
    access: {
      token,
      expires: accessTokenExpires.toDate(),
    },
  };
};

const generateRefreshToken = async (user: Pick<User, 'id'>) => {
  const refreshTokenExpires = moment().add(
    config.jwt.refreshExpirationDays,
    'days',
  );
  const refreshToken = generateToken(
    user.id,
    refreshTokenExpires,
    TokenType.REFRESH,
  );

  await saveToken(
    refreshToken,
    user.id,
    refreshTokenExpires,
    TokenType.REFRESH,
  );

  return {
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

const generateResetPasswordToken = async (
  userId: string,
): Promise<string | undefined> => {
  const expires = moment().add(
    config.jwt.resetPasswordExpirationMinutes,
    'minutes',
  );
  const type = TokenType.RESET_PASSWORD;
  const resetPasswordToken = generateToken(userId, expires, type);
  await revokeTokens(userId, type);
  await saveToken(resetPasswordToken, userId, expires, type);

  return resetPasswordToken;
};

const generateVerifyEmailToken = async (
  user: Pick<User, 'id'>,
): Promise<string> => {
  const expires = moment().add(
    config.jwt.verifyEmailExpirationMinutes,
    'minutes',
  );
  const type = TokenType.VERIFY_EMAIL;
  const verifyEmailToken = generateToken(user.id, expires, type);
  await revokeTokens(user.id, type);
  await saveToken(verifyEmailToken, user.id, expires, type);

  return verifyEmailToken;
};

const generateTotpToken = (user: Pick<User, 'id'>) => {
  const expires = moment().add(5, 'minutes');
  return generateToken(user.id, expires, TokenType.RESTRICTED_ACCESS, {
    scope: 'OTP',
  });
};

const generateSendVerifyEmailToken = (user: Pick<User, 'id'>) => {
  const expires = moment().add(5, 'minutes');
  return generateToken(user.id, expires, TokenType.RESTRICTED_ACCESS, {
    scope: 'SEND_VERIFY_EMAIL',
  });
};

const verifyTotpToken = (token: string) => {
  return verifyToken(token, TokenType.RESTRICTED_ACCESS, 'OTP');
};

const verifySendVerifyEmailToken = (token: string) => {
  return verifyToken(token, TokenType.RESTRICTED_ACCESS, 'SEND_VERIFY_EMAIL');
};

const blacklistTokens = async (userId: string): Promise<void> => {
  await prisma.token.updateMany({
    data: {
      blacklisted: true,
    },
    where: { userId },
  });
};

const deleteExpiredTokens = async () => {
  const refDate = moment().subtract(1, 'hour').toDate();

  return prisma.token.deleteMany({
    where: {
      expiresAt: {
        lte: refDate,
      },
    },
  });
};

const deleteTokenById = async (id: number) => {
  await prisma.token.delete({ where: { id } });
};

export default {
  verifyDatabaseToken,
  verifyTotpToken,
  verifySendVerifyEmailToken,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken,
  generateTotpToken,
  generateSendVerifyEmailToken,
  blacklistTokens,
  deleteTokenById,
  deleteExpiredTokens,
};
