import { doubleCsrf } from 'csrf-csrf';
import config from '#config/index';
import type { NextFunction, Response, Request } from 'express';
import {
  createCookieIfMissing,
  getStringCookie,
  secureCookieOptions,
  secureCookieName,
} from '#utils/cookie';

declare module 'express-serve-static-core' {
  interface Request {
    csrfSessionId?: string | undefined;
  }
}

const CSRF_SESSION_COOKIE_NAME = 'csrf-session';

// Reads the existing CSRF session id but never mints one. Minting on every
// request is racy: concurrent cold-start requests each generate a different id
// and emit a competing `Set-Cookie`, leaving an issued token bound to an id the
// surviving cookie no longer matches. The session is established only when a
// token is issued — see `ensureCsrfSession`.
export function csrfSession(req: Request, _res: Response, next: NextFunction) {
  req.csrfSessionId =
    getStringCookie(req, secureCookieName(CSRF_SESSION_COOKIE_NAME)) ??
    undefined;
  next();
}

// Mints the CSRF session cookie when missing. Mounted only on the token-issuing
// route so the generated token has a stable identifier to bind to.
export function ensureCsrfSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.csrfSessionId = createCookieIfMissing(req, res, CSRF_SESSION_COOKIE_NAME);
  next();
}

const WEB_CLIENT_TYPE = 'web';

// Inbound provider webhooks (e.g. a mail driver's bounce webhook, mounted
// under core/mail's shared `/webhooks` prefix — see MailModule) authenticate
// via a secret in the URL, not a browser-held cookie, so they sit outside
// CSRF's threat model the same way a Bearer request does — see isCsrfExempt.
// Relative to this router's own mount point (`/api/v1`, see app.ts), not the
// full request path. Provider-agnostic on purpose: a new webhook-based
// provider needs no change here.
const CSRF_EXEMPT_PATH_PREFIXES = ['/webhooks/'];

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
//   3. It targets a provider webhook path, authenticated by its own URL
//      secret rather than any ambient credential a browser could replay.
//
// The web client always sends `X-Client-Type: web` (and uses CSRF tokens),
// which keeps it protected.
export function isCsrfExempt(req: Request): boolean {
  const clientType = req.headers['x-client-type'];
  if (typeof clientType === 'string' && clientType !== WEB_CLIENT_TYPE) {
    return true;
  }

  if (req.headers.authorization?.startsWith('Bearer ')) {
    return true;
  }

  return CSRF_EXEMPT_PATH_PREFIXES.some((prefix) =>
    req.path.startsWith(prefix),
  );
}

const { doubleCsrfProtection } = doubleCsrf({
  getSecret: () => config.csrf.secret,
  // Generation always runs after `ensureCsrfSession`; a missing id only occurs
  // on validation, where the random string fails the HMAC check (403, not 500).
  getSessionIdentifier: (req) => req.csrfSessionId ?? crypto.randomUUID(),
  cookieName: secureCookieName('x-csrf-token'),
  cookieOptions: secureCookieOptions(),
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'],
  skipCsrfProtection: isCsrfExempt,
});

export const csrfProtection = [csrfSession, doubleCsrfProtection];
