import { createRateLimiter } from '#core/rate-limit';

export const authLimiter = createRateLimiter('Auth', {
  limit: 15,
  skipSuccessfulRequests: true,
});

// Refresh tokens are unguessable, so this only caps abuse
export const refreshLimiter = createRateLimiter('Refresh', {
  limit: 120,
});

export const generalLimiter = createRateLimiter('General', {
  limit: 250,
});

export const staticLimiter = createRateLimiter('Static', {
  limit: 500,
});

export default {
  authLimiter,
  refreshLimiter,
  generalLimiter,
  staticLimiter,
};
