import { z } from 'zod';
import { translatedValue } from '#core/validation/helper';

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/);
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((value) => {
    const [yearString, monthString, dayString] = value.split('-');
    const year = Number(yearString);
    const month = Number(monthString);
    const day = Number(dayString);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, 'Date must be a valid calendar date');
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
    date: dateSchema.optional().nullable(),
    time: timeSchema.optional().nullable(),
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
      date: dateSchema.nullable(),
      time: timeSchema.nullable(),
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
