import { z } from 'zod';

export const DatabaseSchema = z.object({
  DATABASE_URL: z
    .string()
    .describe('Database connection URL')
    .default('mysql://root:@localhost:3306/app'),
});
