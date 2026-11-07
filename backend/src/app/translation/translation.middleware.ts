import { createRateLimiter } from '#core/rate-limit/rate-limit';

export const translationLimiter = createRateLimiter('Translation', {
  limit: 30,
});
