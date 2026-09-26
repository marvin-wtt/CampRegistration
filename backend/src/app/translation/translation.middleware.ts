import { createRateLimiter } from '#core/rate-limit';

export const translationLimiter = createRateLimiter('Translation', {
  limit: 30,
});
