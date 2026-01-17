import { vi } from 'vitest';

vi.mock('#middlewares/rateLimiter.middleware', () => {
  const passThrough = (_req: any, _res: any, next: any) => next();

  return {
    authLimiter: passThrough,
    generalLimiter: passThrough,
    staticLimiter: passThrough,
    default: {
      authLimiter: passThrough,
      generalLimiter: passThrough,
      staticLimiter: passThrough,
    },
  };
});
