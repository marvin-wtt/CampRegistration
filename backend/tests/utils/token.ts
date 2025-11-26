import { TokenType, User } from '#/generated/prisma/client.js';
import moment from 'moment/moment';
import jwt from 'jsonwebtoken';

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET as string);
};

export const generateToken = (user: User, type: TokenType, data?: object) => {
  const payload = {
    sub: user.id,
    iat: moment().unix(),
    exp: moment().add('1', 'minutes').unix(),
    type,
    ...data,
  };

  return jwt.sign(payload, process.env.JWT_SECRET as string);
};

export const generateExpiredToken = (
  user: User,
  type: TokenType,
  data?: object,
) => {
  return generateToken(user, type, {
    iat: moment().subtract('1', 'week').unix(),
    exp: moment().subtract('6', 'days').unix(),
    ...data,
  });
};

export const generateAccessToken = (user: User) => {
  return generateToken(user, TokenType.ACCESS, {
    role: user.role,
  });
};

export const generateOTPToken = (user: User) => {
  return generateToken(user, TokenType.RESTRICTED_ACCESS, {
    scope: 'OTP',
  });
};

export const generateSendVerifyEmailToken = (user: User) => {
  return generateToken(user, TokenType.RESTRICTED_ACCESS, {
    scope: 'SEND_VERIFY_EMAIL',
  });
};

export const generateRefreshToken = (user: User) => {
  return generateToken(user, TokenType.REFRESH);
};

export const generateResetPasswordToken = (user: User) => {
  return generateToken(user, TokenType.RESET_PASSWORD);
};

export const generateVerifyEmailToken = (user: User) => {
  return generateToken(user, TokenType.VERIFY_EMAIL);
};
