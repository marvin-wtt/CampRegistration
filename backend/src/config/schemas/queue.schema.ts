import { z } from 'zod';

export const QueueEnvSchema = z.object({
  QUEUE_DRIVER: z
    .enum(['database', 'redis', 'memory'])
    .readonly()
    .describe('The queue driver to use')
    .default('database'),
});

export type QueueEnv = z.output<typeof QueueEnvSchema>;
