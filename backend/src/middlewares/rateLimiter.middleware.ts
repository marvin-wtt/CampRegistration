import { rateLimit } from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (request) => `Auth:${request.ip ?? ''}`,
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 100, // limit each IP to 100 requests per windowMs
  keyGenerator: (request) => `General:${request.ip ?? ''}`,
});

export const staticLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 250,
  keyGenerator: (request) => `Static:${request.ip ?? ''}`,
});

export default {
  authLimiter,
  generalLimiter,
  staticLimiter,
};
