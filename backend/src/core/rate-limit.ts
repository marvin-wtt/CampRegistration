import {
  rateLimit,
  ipKeyGenerator,
  type Options,
  type RateLimitRequestHandler,
} from 'express-rate-limit';
import type { Request } from 'express';
import config from '#config/index';

export type RateLimitPolicy = Omit<Partial<Options>, 'skip' | 'keyGenerator'>;

// Pinned here rather than inherited from express-rate-limit's own default, so
// an upstream change can't silently move every window in the app.
const DEFAULT_WINDOW_MS = 60 * 1000;

export function createRateLimiter(
  name: string,
  policy: RateLimitPolicy,
): RateLimitRequestHandler {
  return rateLimit({
    windowMs: DEFAULT_WINDOW_MS,
    ...policy,
    skip: () => config.rateLimit.disabled,
    keyGenerator: (req: Request) => `${name}:${ipKeyGenerator(req.ip ?? '')}`,
  });
}
