import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 100, // limit each IP to 100 requests per windowMs
});
