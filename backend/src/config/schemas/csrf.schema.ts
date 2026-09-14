import { z } from 'zod';

export const CsrfEnvSchema = z.object({
  CSRF_SECRET: z.string().describe('CSRF secret key').readonly(),
});

export type CsrfEnv = z.output<typeof CsrfEnvSchema>;
