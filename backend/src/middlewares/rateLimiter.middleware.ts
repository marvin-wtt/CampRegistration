import { rateLimit, MemoryStore } from "express-rate-limit";

// Expose store to reset it for tests
export const store = new MemoryStore();

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  store,
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 100, // limit each IP to 100 requests per windowMs
  store,
});
