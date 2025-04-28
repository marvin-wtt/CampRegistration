import { z } from 'zod';

export const CsrfEnvSchema = z.object({
  CSRF_SECRET: z.string(),
});
