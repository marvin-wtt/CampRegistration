import { z } from 'zod';

export const DatabaseSchema = z.object({
  DB_HOST: z.coerce
    .string()
    .describe('Database hostname or IP address')
    .default('localhost'),
  DB_PORT: z.coerce
    .number()
    .int()
    .positive()
    .describe('MariaDB/MySQL port number')
    .default(3306),
  DB_USER: z.string().describe('Database username').default('root'),
  DB_PASSWORD: z.string().describe('Database password').default(''),
  DB_NAME: z.string().describe('Database name to connect to').default('app'),
});
