import { createRateLimiter } from '#core/rate-limit';

export const authLimiter = createRateLimiter('Auth', {
  limit: 15,
  skipSuccessfulRequests: true,
});

export const generalLimiter = createRateLimiter('General', {
  limit: 250,
});

export const staticLimiter = createRateLimiter('Static', {
  limit: 500,
});

export default {
  authLimiter,
  generalLimiter,
  staticLimiter,
};
