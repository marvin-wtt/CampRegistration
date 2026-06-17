import config from '#config';
import type { CookieOptions, Request, Response } from 'express';
import { randomBytes } from 'node:crypto';

// Derive cookie security from the actual scheme the app is served over, not the
// environment. Over plain HTTP (local dev and the e2e suite on http://localhost)
// `Secure`/`__Host-` cookies are dropped by the browser, which would break the
// CSRF double-submit flow. Only real HTTPS deployments get them.
function isSecureOrigin(): boolean {
  try {
    return new URL(config.origin).protocol === 'https:';
  } catch {
    // `APP_URL` is unset or not an absolute URL. Don't crash boot — fall back to
    // the environment so production still gets Secure cookies by default.
    return config.env !== 'development';
  }
}

const secure = isSecureOrigin();

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

// Safely reads a string cookie by its exact name. Shared by the JWT cookie
// extractor and the refresh-token reader so they can't diverge.
export function getStringCookie(req: Request, name: string): string | null {
  const cookies: unknown = req.cookies;
  if (
    cookies &&
    typeof cookies === 'object' &&
    name in cookies &&
    typeof (cookies as Record<string, unknown>)[name] === 'string'
  ) {
    return (cookies as Record<string, string>)[name];
  }

  return null;
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
