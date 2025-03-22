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
  const cookies: unknown = req.cookies;
  if (
    cookies &&
    typeof cookies === 'object' &&
    'accessToken' in cookies &&
    typeof cookies.accessToken === 'string'
  ) {
    return cookies.accessToken;
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

const isPayload = (
  payload: unknown,
): payload is { type: string; sub: string } => {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'type' in payload &&
    typeof payload.type === 'string' &&
    'sub' in payload &&
    typeof payload.sub === 'string'
  );
};

const jwtVerify: VerifyCallback = (payload: unknown, done) => {
  if (!isPayload(payload)) {
    done(`Invalid payload data: ${JSON.stringify(payload)}`);
    return;
  }

  if (payload.type !== TokenType.ACCESS) {
    done('Invalid token type', false);
    return;
  }

  userService
    .getUserById(payload.sub)
    .then((user) => {
      done(null, user);
    })
    .catch(done);
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

const anonymousStrategy = new AnonymousStrategy();

export function initializePassport() {
  const handler = passport.initialize();
  passport.use(jwtStrategy);
  passport.use(anonymousStrategy);

  return handler;
}
