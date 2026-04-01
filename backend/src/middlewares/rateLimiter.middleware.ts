import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import type { Request } from 'express';

const keyGenerator = (name: string) => {
  return (req: Request): string => {
    const key = ipKeyGenerator(req.ip ?? '');

    return `${name}:${key}`;
  };
};

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  skipSuccessfulRequests: true,
  keyGenerator: keyGenerator('Auth'),
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 250, // limit each IP to 250 requests per windowMs
  keyGenerator: keyGenerator('General'),
});

export const staticLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 500,
  keyGenerator: keyGenerator('Static'),
});

export default {
  authLimiter,
  generalLimiter,
  staticLimiter,
};
