import prisma from "../client";
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  VerifyCallback,
} from "passport-jwt";
import { Strategy as AnonymousStrategy } from "passport-anonymous";
import { Request } from "express";

import config from "./index";
import { TokenType } from "@prisma/client";

function cookieExtractor(req: Request) {
  if (req && req.signedCookies && "accessToken" in req.signedCookies) {
    return req.signedCookies.accessToken;
  }
  if (req && req.cookies && "accessToken" in req.cookies) {
    return req.cookies.accessToken;
  }
  return null;
}

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),
    cookieExtractor,
  ]),
};

const jwtVerify: VerifyCallback = async (payload, done) => {
  try {
    if (payload.type !== TokenType.ACCESS) {
      throw new Error("Invalid token type");
    }
    // TODO Use service
    const user = await prisma.user.findUnique({
      select: {
        id: true,
        email: true,
        name: true,
        camps: {
          select: {
            id: true,
          },
        },
      },
      where: { id: payload.sub },
    });
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

export const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

export const anonymousStrategy = new AnonymousStrategy();
