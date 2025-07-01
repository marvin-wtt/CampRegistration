import { z } from 'zod/v4';

export const CsrfEnvSchema = z.object({
  CSRF_SECRET: z.string(),
});
