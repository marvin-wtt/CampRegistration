import { vi } from 'vitest';
import { NextFunction } from 'express';

export function mockRateLimiter() {
  vi.mock('../../src/middlewares/rateLimiter.middleware', () => ({
    // Mock rate limiters to do nothing
    generalLimiter: (_req: Request, _res: Response, next: NextFunction) =>
      next(),
    authLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
    staticLimiter: (_req: Request, _res: Response, next: NextFunction) =>
      next(),
  }));
}
