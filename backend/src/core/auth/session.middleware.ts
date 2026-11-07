import type { Request, Response, NextFunction } from 'express';
import { createCookieIfMissing } from '#core/auth/cookie';

declare module 'express-serve-static-core' {
  interface Request {
    sessionId: string;
  }
}

export function sessionId(req: Request, res: Response, next: NextFunction) {
  req.sessionId = createCookieIfMissing(req, res, 'session');
  next();
}
