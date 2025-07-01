import { z } from 'zod/v4';

const store = z.object({
  body: z.object({
    message: z.string(),
    location: z.string().optional(),
    userAgent: z.string().optional(),
    email: z.email().optional(),
  }),
});

export default {
  store,
};
