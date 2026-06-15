import { doubleCsrf } from 'csrf-csrf';
import { ExtractJwt } from 'passport-jwt';
import config from '#config/index';
import type { NextFunction, Response, Request } from 'express';
import {
  createCookieIfMissing,
  secureCookieOptions,
  secureCookieName,
} from '#utils/cookie';

declare module 'express-serve-static-core' {
  interface Request {
    csrfSessionId?: string | undefined;
  }
}

const CSRF_SESSION_COOKIE_NAME = 'csrf-session';

// Using a separate cookie because the session id races between all initial requests.
export function csrfSession(req: Request, res: Response, next: NextFunction) {
  req.csrfSessionId = createCookieIfMissing(req, res, CSRF_SESSION_COOKIE_NAME);
  next();
}

const jwtFromHeader = ExtractJwt.fromAuthHeaderAsBearerToken();

const { doubleCsrfProtection } = doubleCsrf({
  getSecret: () => config.csrf.secret,
  getSessionIdentifier: (req) => {
    if (!req.csrfSessionId) {
      throw new Error('Session ID is not set for the request.');
    }

    return req.csrfSessionId;
  },
  cookieName: secureCookieName('x-csrf-token'),
  cookieOptions: secureCookieOptions(),
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'],
  skipCsrfProtection: (req) => {
    if (req.isUnauthenticated()) {
      return true;
    }

    // Only skip for Bearer token auth — non-browser clients can't be CSRF-attacked
    return jwtFromHeader(req) !== null;
  },
});

export const csrfProtection = [csrfSession, doubleCsrfProtection];
