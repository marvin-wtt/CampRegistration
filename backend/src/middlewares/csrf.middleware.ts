import { doubleCsrf } from 'csrf-csrf';
import config from '#config/index';
import type { NextFunction, Response, Request } from 'express';
import {
  createCookieIfMissing,
  secureCookieOptions,
  secureCookieName,
} from '#utils/cookie';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '#app/auth/auth.cookies';

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

const AUTH_COOKIE_NAMES = [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE] as const;
function hasAuthCookie(req: Request): boolean {
  return AUTH_COOKIE_NAMES.some((name) => {
    const value: unknown = req.cookies[name];
    return typeof value === 'string' && value.length > 0;
  });
}

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
    // Any request carrying auth cookies can be CSRF-able,
    // even on public routes and even if Passport treats it as unauthenticated
    // because the access token is expired.
    return !hasAuthCookie(req);
  },
});

export const csrfProtection = [csrfSession, doubleCsrfProtection];
