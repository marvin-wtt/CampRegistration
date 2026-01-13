import { z } from 'zod';

export const QueueSchema = z.object({
  QUEUE_DRIVER: z
    .enum(['database', 'redis', 'memory'])
    .readonly()
    .describe('The queue driver to use')
    .default('database'),
});
