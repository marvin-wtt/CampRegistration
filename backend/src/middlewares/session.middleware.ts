import type { Request, Response, NextFunction, CookieOptions } from 'express';
import { randomBytes } from 'node:crypto';
import config from '#config/index';

declare module 'express-serve-static-core' {
  interface Request {
    sessionId: string;
  }
}

const secure = config.env !== 'development';

const COOKIE_NAME = secure ? '__Host-session' : 'session';

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  path: '/',
  secure,
};

export function sessionId(req: Request, res: Response, next: NextFunction) {
  const existing: unknown = req.cookies[COOKIE_NAME];

  const sessionId =
    typeof existing === 'string' && existing
      ? existing
      : randomBytes(16).toString('hex');

  if (sessionId !== existing) {
    res.cookie(COOKIE_NAME, sessionId, COOKIE_OPTIONS);
  }

  req.sessionId = sessionId;

  next();
}
