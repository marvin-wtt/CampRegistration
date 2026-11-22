import { z } from 'zod';
import { DateSchema } from '#core/validation/helper';

const index = z.object({
  params: z.object({
    eventId: z.ulid(),
  }),
});

const update = z.object({
  params: z.object({
    eventId: z.ulid(),
    date: DateSchema,
  }),
  body: z.object({
    plan: z.enum(['a', 'b', 'both']),
  }),
});

const destroy = z.object({
  params: z.object({
    eventId: z.ulid(),
    date: DateSchema,
  }),
});

const bulkPublish = z.object({
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
