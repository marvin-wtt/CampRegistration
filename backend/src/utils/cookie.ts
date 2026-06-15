import config from '#config';
import type { CookieOptions, Request, Response } from 'express';
import { randomBytes } from 'node:crypto';

const secure = config.env !== 'development';

export const SECURE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  path: '/',
  secure,
};

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
  res.cookie(cookieName, sessionId, SECURE_COOKIE_OPTIONS);

  return sessionId;
}
