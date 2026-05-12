import { z } from 'zod';
import { translatedValue } from '#core/validation/helper';

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/);
const dateSchema = z.string(); // TODO Should be raw string YYYY-MM-DD
const planSchema = z.enum(['a', 'b', 'both']);

const show = z.object({
  params: z.object({
    campId: z.ulid(),
    programEventId: z.ulid(),
  }),
});

const index = z.object({
  params: z.object({
    campId: z.ulid(),
  }),
});

const store = z.object({
  params: z.object({
    campId: z.ulid(),
  }),
  body: z.object({
    title: translatedValue(z.string()),
    details: translatedValue(z.string()).optional().nullable(),
    location: translatedValue(z.string()).optional().nullable(),
    date: dateSchema.optional(),
    time: timeSchema.optional().nullable(),
    duration: z.number().min(0).optional().nullable(),
    color: z.string().optional().nullable(),
    plan: planSchema.optional(),
  }),
});

const update = z.object({
  params: z.object({
    campId: z.ulid(),
    programEventId: z.ulid(),
  }),
  body: z
    .object({
      title: translatedValue(z.string()),
      details: translatedValue(z.string()).nullable(),
      location: translatedValue(z.string()).nullable(),
      date: dateSchema,
      time: timeSchema.nullable(),
      duration: z.number().min(0).nullable(),
      color: z.string().nullable(),
      plan: planSchema,
    })
    .partial(),
});

const destroy = z.object({
  params: z.object({
    campId: z.ulid(),
    programEventId: z.ulid(),
  }),
});

export default {
  show,
  index,
  store,
  update,
  destroy,
};
