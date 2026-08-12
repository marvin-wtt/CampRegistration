import { z, type ZodType } from 'zod';
import { translatedValue } from '#core/validation/helper';
import type { Camp } from '#generated/prisma/client.js';
import type { CampQuery } from '@camp-registration/common/entities';

const show = z.object({
  params: z.object({
    campId: z.ulid(),
  }),
});

const index = z.object({
  query: z
    .object({
      // Filter
      name: z.string(),
      startAt: z.iso.datetime(),
      endAt: z.iso.datetime(),
      age: z.coerce.number(),
      country: z.string().length(2),
      public: z.stringbool(),
      status: z.enum(['open', 'upcoming', 'closed']),
      view: z.enum(['all', 'assigned']),
      // Options
      cursor: z.ulid(),
      limit: z.coerce.number().int().positive().max(100),
      sortBy: z.string(),
      sortType: z.enum(['asc', 'desc']),
    })
    .partial() satisfies ZodType<CampQuery>,
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
      public: z.boolean().optional(),
      registrationOpensAt: z.iso
        .datetime()
        .transform((val) => new Date(val))
        .nullable()
        .optional(),
      registrationClosesAt: z.iso
        .datetime()
        .transform((val) => new Date(val))
        .nullable()
        .optional(),
      countries: z.array(z.string().length(2)).min(1),
      name: translatedValue(z.string()),
      organizer: translatedValue(z.string()),
      contactEmail: translatedValue(z.email()),
      maxParticipants: translatedValue(z.number().int().nonnegative()),
      confirmationMode: z.enum(['AUTOMATIC', 'MANUAL']).optional(),
      startAt: z.iso.datetime().transform((val) => new Date(val)),
      endAt: z.iso.datetime().transform((val) => new Date(val)),
      minAge: z.number().int().nonnegative(),
      maxAge: z.number().int().max(99),
      location: translatedValue(z.string()),
      price: z.number().multipleOf(0.01).nonnegative(),
      form: z.record(z.string(), z.unknown()).optional(),
      themes: z.record(z.string(), z.unknown()).optional(),
      preset: z.enum(['standard', 'minimal']).nullable().optional(),
      referenceCampId: z.ulid().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.preset === null && val.referenceCampId == null) {
        const key = 'preset';
        ctx.addIssue({
          code: 'custom',
          message: 'Preset must not be null',
          path: [key],
          input: val[key],
        });
      }

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
            input: val[key],
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
            input: val[keyMin],
          });
        }
      }
    }),
});

const update = (camp: Camp) =>
  z.object({
    params: z.object({
      campId: z.ulid(),
    }),
    body: z
      .object({
        public: z.boolean(),
        registrationOpensAt: z.iso
          .datetime()
          .transform((val) => new Date(val))
          .nullable()
          .optional(),
        registrationClosesAt: z.iso
          .datetime()
          .transform((val) => new Date(val))
          .nullable()
          .optional(),
        countries: z.array(z.string().length(2)).min(1),
        name: translatedValue(z.string()),
        organizer: translatedValue(z.string()),
        contactEmail: translatedValue(z.email()),
        maxParticipants: translatedValue(z.number().int().nonnegative()),
        confirmationMode: z.enum(['AUTOMATIC', 'MANUAL']),
        startAt: z.iso.datetime().transform((val) => new Date(val)),
        endAt: z.iso.datetime().transform((val) => new Date(val)),
        minAge: z.number().int().nonnegative(),
        maxAge: z.number().int().max(99),
        location: translatedValue(z.string()),
        price: z.number().nonnegative().multipleOf(0.01),
        form: z.record(z.string(), z.unknown()),
        themes: z.record(z.string(), z.unknown()),
      })
      .partial()
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
          const value = val[key] ?? camp[key];
          if (
            value &&
            typeof value === 'object' &&
            !validateRecordKeys(value, val.countries ?? camp.countries)
          ) {
            ctx.addIssue({
              code: 'custom',
              message: 'Missing or invalid key(s)',
              path: [key],
              input: val[key],
            });
          }
        }

        const compareKeys = [
          ['minAge', 'maxAge'],
          ['startAt', 'endAt'],
        ] as const;

        for (const [keyMin, keyMax] of compareKeys) {
          const minVal = val[keyMin] ?? camp[keyMin];
          const maxVal = val[keyMax] ?? camp[keyMax];

          if (minVal > maxVal) {
            ctx.addIssue({
              code: 'custom',
              message: 'Min value must be smaller than or equal to max value',
              path: [keyMin],
              input: val[keyMin],
            });
          }
        }
      }),
  });

const destroy = z.object({
  params: z.object({
    campId: z.ulid(),
  }),
});

export default {
  show,
  index,
  store,
  update,
  destroy,
};
