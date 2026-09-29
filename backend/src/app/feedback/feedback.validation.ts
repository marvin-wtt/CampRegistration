import { z } from 'zod';

const store = z.object({
  body: z.object({
    message: z.string(),
    name: z.string().trim().min(1).max(255).optional(),
    email: z.email().optional(),
  }),
});

export default {
  store,
};
