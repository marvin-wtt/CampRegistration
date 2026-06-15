import { doubleCsrf } from 'csrf-csrf';
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

// CSRF uses its own session cookie instead of the general `session` cookie.
// The auth/session cookie lifecycle is tied to login/logout (it gets cleared
// and rotated), which would invalidate outstanding CSRF tokens mid-session.
// A dedicated, long-lived identifier keeps issued tokens valid across auth
// state changes and avoids the race where concurrent requests each mint a new
// session id.
export function csrfSession(req: Request, res: Response, next: NextFunction) {
  req.csrfSessionId = createCookieIfMissing(req, res, CSRF_SESSION_COOKIE_NAME);
  next();
}

const WEB_CLIENT_TYPE = 'web';

// A request is exempt from CSRF protection only when it provably cannot be
// forged through a victim's browser:
//
//   1. It carries a non-`web` `X-Client-Type` header. The native app sends this
//      so it can authenticate (login / 2FA) and fetch data without the
//      double-submit cookie flow. A cross-site attacker cannot set a custom
//      header on a credentialed request (it triggers a CORS preflight that the
//      server rejects), so a forged request never carries one. A *missing*
//      header is therefore always treated as a protected web request.
//   2. It is authenticated with a Bearer token. Browsers never attach an
//      Authorization header automatically, so such requests cannot be forged.
//
// The web client always sends `X-Client-Type: web` (and uses CSRF tokens),
// which keeps it protected.
export function isCsrfExempt(req: Request): boolean {
  const clientType = req.headers['x-client-type'];
  if (typeof clientType === 'string' && clientType !== WEB_CLIENT_TYPE) {
    return true;
  }

  return req.headers.authorization?.startsWith('Bearer ') ?? false;
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
  skipCsrfProtection: (req) => !config.csrf.enabled || isCsrfExempt(req),
});

export const csrfProtection = [csrfSession, doubleCsrfProtection];
