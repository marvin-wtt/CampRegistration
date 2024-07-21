import {
  Strategy as JwtStrategy,
  ExtractJwt,
  VerifyCallback,
} from 'passport-jwt';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import { Request } from 'express';

import config from './index';
import { TokenType } from '@prisma/client';

function cookieExtractor(req: Request) {
  if (req && req.cookies && 'accessToken' in req.cookies) {
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
  if (payload.type !== TokenType.ACCESS) {
    done('Invalid token type', false);
    return;
  }

  const user = {
    id: payload.sub,
    role: payload.role,
  };

  done(null, user);
};

export const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

export const anonymousStrategy = new AnonymousStrategy();
