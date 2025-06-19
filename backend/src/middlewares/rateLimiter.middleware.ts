import { rateLimit } from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  skipSuccessfulRequests: true,
  keyGenerator: (request) => `Auth:${request.ip ?? ''}`,
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 250, // limit each IP to 250 requests per windowMs
  keyGenerator: (request) => `General:${request.ip ?? ''}`,
});

export const staticLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 500,
  keyGenerator: (request) => `Static:${request.ip ?? ''}`,
});

export default {
  authLimiter,
  generalLimiter,
  staticLimiter,
};
