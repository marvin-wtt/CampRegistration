import { z } from 'zod';
import {
  translatedValue,
  DateSchema,
  TimeSchema,
} from '#core/validation/helper';

const planSchema = z.enum(['a', 'b', 'both']);
const colorSchema = z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);

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
    date: DateSchema.optional().nullable(),
    time: TimeSchema.optional().nullable(),
    duration: z.number().min(1).optional().nullable(),
    color: colorSchema.optional().nullable(),
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
      date: DateSchema.nullable(),
      time: TimeSchema.nullable(),
      duration: z.number().min(1).nullable(),
      color: colorSchema.nullable(),
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
