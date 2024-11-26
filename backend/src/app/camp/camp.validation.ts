import { z } from 'zod';
import { translatedValue, BooleanStringSchema } from 'core/validation/helper';

const show = z.object({
  params: z.object({
    campId: z.string(),
  }),
});

const index = z.object({
  query: z
    .object({
      // Filter
      name: z.string(),
      startAt: z.string().datetime(),
      endAt: z.string().datetime(),
      age: z.coerce.number(),
      country: z.string().length(2),
      showAll: BooleanStringSchema,
      // Options
      page: z.coerce.number().positive(),
      limit: z.coerce.number().int().positive(),
      sortBy: z.string(),
      sortType: z.enum(['asc', 'desc']),
    })
    .partial(),
});

const store = z.object({
  body: z.object({
    active: z.boolean().default(false),
    public: z.boolean().default(false),
    countries: z.array(z.string()).min(1),
    name: translatedValue(z.string()),
    organizer: translatedValue(z.string()),
    contactEmail: translatedValue(z.string().email()),
    maxParticipants: translatedValue(z.number().int().nonnegative()),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    minAge: z.number().int().nonnegative(),
    maxAge: z.number().int().max(99),
    location: translatedValue(z.string()),
    price: z.number().multipleOf(0.01).nonnegative(),
    form: z.record(z.unknown()).optional(),
    themes: z.record(z.string(), z.unknown()).optional(),
    referenceCampId: z.string().optional(),
  }),
});

const update = z.object({
  params: z.object({
    campId: z.string(),
  }),
  body: z
    .object({
      active: z.boolean(),
      public: z.boolean(),
      countries: z.array(z.string()).min(1),
      name: translatedValue(z.string()),
      organizer: translatedValue(z.string()),
      contactEmail: translatedValue(z.string()),
      maxParticipants: translatedValue(z.number().int().nonnegative()),
      startAt: z.string().datetime(),
      endAt: z.string().datetime(),
      minAge: z.number().int().nonnegative(),
      maxAge: z.number().int().max(99),
      location: translatedValue(z.string()),
      price: z.number().nonnegative().multipleOf(0.01),
      form: z.unknown(),
      themes: z.record(z.string(), z.unknown()),
    })
    .partial(),
});

const destroy = z.object({
  params: z.object({
    campId: z.string(),
  }),
});

export default {
  show,
  index,
  store,
  update,
  destroy,
};
