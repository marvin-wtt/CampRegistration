import { z } from 'zod';
import { DateSchema } from '#core/validation/helper';

export const index = z.object({
  params: z.object({
    eventId: z.ulid(),
  }),
});

export const update = z.object({
  params: z.object({
    eventId: z.ulid(),
    date: DateSchema,
  }),
  body: z.object({
    plan: z.enum(['a', 'b', 'both']),
  }),
});

export const destroy = z.object({
  params: z.object({
    eventId: z.ulid(),
    date: DateSchema,
  }),
});

export const bulkPublish = z.object({
  params: z.object({
    eventId: z.ulid(),
  }),
  body: z.object({
    plan: z.enum(['a', 'b', 'both']),
  }),
});

export default {
  index,
  update,
  destroy,
  bulkPublish,
};
