import { vi } from 'vitest';

vi.mock('#middlewares/rateLimiter.middleware', () => {
  const passThrough = (_req: any, _res: any, next: any) => next();

  return {
    authLimiter: passThrough,
    refreshLimiter: passThrough,
    generalLimiter: passThrough,
    staticLimiter: passThrough,
    default: {
      authLimiter: passThrough,
      refreshLimiter: passThrough,
      generalLimiter: passThrough,
      staticLimiter: passThrough,
    },
  };
});
