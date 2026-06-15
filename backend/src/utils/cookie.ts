import config from '#config';
import type { CookieOptions, Request, Response } from 'express';
import { randomBytes } from 'node:crypto';

// Derive cookie security from the actual scheme the app is served over, not the
// environment. Over plain HTTP (local dev and the e2e suite on http://localhost)
// `Secure`/`__Host-` cookies are dropped by the browser, which would break the
// CSRF double-submit flow. Only real HTTPS deployments get them.
const secure = new URL(config.origin).protocol === 'https:';

export function secureCookieOptions(
  options?: Partial<CookieOptions>,
): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    secure,
    ...options,
  };
}

export function secureCookieName(name: string): string {
  return secure ? `__Host-${name}` : name;
}

export function createCookieIfMissing(
  req: Request,
  res: Response,
  name: string,
): string {
  const cookieName = secureCookieName(name);

  const existing: unknown = req.cookies[cookieName];
  if (existing && typeof existing === 'string') {
    return existing;
  }

  const sessionId = randomBytes(16).toString('hex');
  res.cookie(cookieName, sessionId, secureCookieOptions());

  return sessionId;
}
