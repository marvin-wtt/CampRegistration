import { z, type ZodType } from 'zod';
import { translatedValue } from '#core/validation/helper';
import type {
  ChoreCreateData,
  ChoreUpdateData,
} from '@camp-registration/common/entities';

const DEFAULT_COUNT = z.number().int().positive().nullable();

const show = z.object({
  params: z.object({
    eventId: z.ulid(),
    choreId: z.ulid(),
  }),
});

const index = z.object({
  params: z.object({
    eventId: z.ulid(),
  }),
});

const store = z.object({
  params: z.object({
    eventId: z.ulid(),
  }),
  body: z.object({
    name: translatedValue(z.string().min(1)),
    defaultCount: DEFAULT_COUNT.optional(),
    excludeStaff: z.boolean().optional(),
    balanceCountries: z.boolean().optional(),
  }) satisfies ZodType<ChoreCreateData>,
});

const update = z.object({
  params: z.object({
    eventId: z.ulid(),
    choreId: z.ulid(),
  }),
  body: z
    .object({
      name: translatedValue(z.string().min(1)),
      sortOrder: z.number().int(),
      defaultCount: DEFAULT_COUNT,
      excludeStaff: z.boolean(),
      balanceCountries: z.boolean(),
    })
    .partial() satisfies ZodType<ChoreUpdateData>,
});

const destroy = z.object({
  params: z.object({
    eventId: z.ulid(),
    choreId: z.ulid(),
  }),
});

export default {
  show,
  index,
  store,
  update,
  destroy,
};
