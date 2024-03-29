import jwt from 'jsonwebtoken';
import moment, { Moment } from 'moment';
import httpStatus from 'http-status';
import config from 'config';
import userService from './user.service';
import ApiError from 'utils/ApiError';
import { Token, TokenType, User } from '@prisma/client';
import prisma from 'client';
import { AuthTokensResponse } from 'types/response';

const generateToken = (
  userId: string,
  expires: Moment,
  type: TokenType,
  secret = config.jwt.secret,
): string => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
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

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token: string, type: TokenType): Promise<Token> => {
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

  const userId = payload.sub;
  const tokenData = await prisma.token.findFirst({
    where: { token, type, userId, blacklisted: false },
  });

  if (!tokenData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Invalid token');
  }

  return tokenData;
};

/**
 * Generate auth tokens
 * @param {User} user
 * @param remember
 * @returns {Promise<AuthTokensResponse>}
 */
const generateAuthTokens = async (
  user: Pick<User, 'id'>,
  remember = false,
): Promise<AuthTokensResponse> => {
  const accessTokenExpires = moment().add(
    config.jwt.accessExpirationMinutes,
    'minutes',
  );
  const accessToken = generateToken(
    user.id,
    accessTokenExpires,
    TokenType.ACCESS,
  );

  if (!remember) {
    return {
      access: {
        token: accessToken,
        expires: accessTokenExpires.toDate(),
      },
    };
  }

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
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};
/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (
  email: string,
): Promise<string | undefined> => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    return undefined;
  }
  const expires = moment().add(
    config.jwt.resetPasswordExpirationMinutes,
    'minutes',
  );
  const type = TokenType.RESET_PASSWORD;
  const resetPasswordToken = generateToken(user.id, expires, type);
  await revokeTokens(user.id, type);
  await saveToken(resetPasswordToken, user.id, expires, type);

  return resetPasswordToken;
};

/**
 * Generate verify email token
 * @param {User} user
 * @returns {Promise<string>}
 */
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

export default {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken,
  deleteExpiredTokens,
};
