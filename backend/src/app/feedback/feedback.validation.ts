import { z } from 'zod';

const store = z.object({
  body: z.object({
    message: z.string(),
    location: z.string().optional(),
    userAgent: z.string().optional(),
    email: z.string().email().optional(),
  }),
});

export default {
  store,
};
