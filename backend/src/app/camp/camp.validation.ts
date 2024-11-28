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

function validateRecordKeys(
  record: Record<string, unknown>,
  allowedKeys: string[],
) {
  const recordKeys = Object.keys(record);

  if (recordKeys.length !== allowedKeys.length) {
    return false;
  }

  return recordKeys.every((key) => allowedKeys.includes(key));
}

const store = z.object({
  body: z
    .object({
      active: z.boolean().default(false),
      public: z.boolean().default(false),
      countries: z.array(z.string()).min(1),
      name: translatedValue(z.string()),
      organizer: translatedValue(z.string()),
      contactEmail: translatedValue(z.string().email()),
      maxParticipants: translatedValue(z.number().int().nonnegative()),
      startAt: z
        .string()
        .datetime()
        .transform((val) => new Date(val)),
      endAt: z
        .string()
        .datetime()
        .transform((val) => new Date(val)),
      minAge: z.number().int().nonnegative(),
      maxAge: z.number().int().max(99),
      location: translatedValue(z.string()),
      price: z.number().multipleOf(0.01).nonnegative(),
      form: z.record(z.unknown()).optional(),
      themes: z.record(z.string(), z.unknown()).optional(),
      referenceCampId: z.string().optional(),
    })
    .superRefine((val, ctx) => {
      const recordKeys = [
        'name',
        'organizer',
        'contactEmail',
        'maxParticipants',
        'location',
      ] as const;

      // Validate Translated keys
      for (const key of recordKeys) {
        const value = val[key];
        if (
          typeof value === 'object' &&
          !validateRecordKeys(value, val.countries)
        ) {
          ctx.addIssue({
            code: 'custom',
            message: 'Missing or invalid key(s)',
            path: [key],
          });
        }
      }

      const compareKeys = [
        ['minAge', 'maxAge'],
        ['startAt', 'endAt'],
      ] as const;

      for (const [keyMin, keyMax] of compareKeys) {
        const minVal = val[keyMin];
        const maxVal = val[keyMax];

        if (minVal > maxVal) {
          ctx.addIssue({
            code: 'custom',
            message: 'Min value must be smaller than or equal to max value',
            path: [keyMin],
          });
        }
      }
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
    .partial()
    .superRefine((arg, ctx) => {
      // TODO Validate fields
    }),
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
