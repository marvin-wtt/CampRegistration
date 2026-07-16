import { z } from 'zod';

export const RealtimeEnvSchema = z.object({
  REALTIME_DRIVER: z
    .enum(['redis', 'memory'])
    .readonly()
    .describe(
      'The realtime event bus driver. Defaults to redis when the queue driver ' +
        'is redis (multi-instance deployment), memory otherwise.',
    )
    .optional(),
});

export type RealtimeEnv = z.output<typeof RealtimeEnvSchema>;
