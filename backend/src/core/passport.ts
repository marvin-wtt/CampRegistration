import {
  Strategy as JwtStrategy,
  ExtractJwt,
  type VerifyCallback,
} from 'passport-jwt';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import type { Request } from 'express';

import config from '#config/index';
import { TokenType } from '@prisma/client';
import passport from 'passport';
import userService from '#app/user/user.service.js';

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

  const user = await userService.getUserById(payload.sub);

  done(null, user);
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

const anonymousStrategy = new AnonymousStrategy();

export function initializePassport() {
  const handler = passport.initialize();
  passport.use(jwtStrategy);
  passport.use(anonymousStrategy);

  return handler;
}
