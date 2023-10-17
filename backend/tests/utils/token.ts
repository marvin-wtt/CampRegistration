import { TokenType, User } from "@prisma/client";
import moment from "moment/moment";
import jwt from "jsonwebtoken";

export function generateAccessToken(user: User) {
  const payload = {
    sub: user.id,
    iat: moment().unix(),
    exp: moment().add("1", "minutes").unix(),
    type: TokenType.ACCESS,
  };

  return jwt.sign(payload, process.env.JWT_SECRET as string);
}
