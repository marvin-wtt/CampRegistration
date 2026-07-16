import { z } from 'zod';

export const CsrfEnvSchema = z.object({
  CSRF_SECRET: z.string(),
});

export type CsrfEnv = z.output<typeof CsrfEnvSchema>;
