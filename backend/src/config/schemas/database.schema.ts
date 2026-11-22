import { z } from 'zod';

export const DatabaseEnvSchema = z.object({
  DATABASE_URL: z.string().describe('Database connection URL'),
});
