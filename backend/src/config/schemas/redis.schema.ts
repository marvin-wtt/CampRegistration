import { z } from 'zod';

export const RedisSchema = z.object({
  REDIS_HOST: z.string().optional().describe('Host of the Redis server'),
  REDIS_USERNAME: z
    .string()
    .describe('Username for Redis server')
    .default('default'),
  REDIS_PORT: z.coerce
    .number()
    .min(0)
    .max(65535)
    .describe('Port to connect to the Redis server')
    .default(6379),
  REDIS_PASSWORD: z.string().optional().describe('Password for Redis server'),
  REDIS_DB: z.coerce
    .number()
    .min(0)
    .max(15)
    .describe('Database number to use in Redis')
    .default(0),
});
