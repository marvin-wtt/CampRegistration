import { TokenType, User } from "@prisma/client";
import moment from "moment/moment";
import jwt from "jsonwebtoken";

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET as string);
};

export const generateToken = (user: User, type: TokenType, data?: object) => {
  const payload = {
    sub: user.id,
    iat: moment().unix(),
    exp: moment().add("1", "minutes").unix(),
    type,
    ...data,
  };

  return jwt.sign(payload, process.env.JWT_SECRET as string);
};

export const generateAccessToken = (user: User) => {
  return generateToken(user, TokenType.ACCESS);
};

export const generateResetPasswordToken = (user: User) => {
  return generateToken(user, TokenType.RESET_PASSWORD);
};

export const generateVerifyEmailToken = (user: User) => {
  return generateToken(user, TokenType.VERIFY_EMAIL);
};
