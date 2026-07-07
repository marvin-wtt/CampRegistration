import { z } from 'zod';

export const RealtimeSchema = z.object({
  REALTIME_DRIVER: z
    .enum(['redis', 'memory'])
    .readonly()
    .describe(
      'The realtime event bus driver. Defaults to redis when the queue driver ' +
        'is redis (multi-instance deployment), memory otherwise.',
    )
    .optional(),
});
