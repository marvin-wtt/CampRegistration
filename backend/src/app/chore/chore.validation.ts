import { z, type ZodType } from 'zod';
import { translatedValue } from '#core/validation/helper';
import type {
  ChoreCreateData,
  ChoreUpdateData,
} from '@camp-registration/common/entities';

const DEFAULT_COUNT = z.number().int().positive().nullable();
const COUNT = z.number().int().min(0).max(1000);
const ELIGIBILITY = z.enum(['PARTICIPANTS', 'STAFF', 'EVERYONE']);
const EFFORT = z.enum(['LIGHT', 'NORMAL', 'HEAVY']);
const ROTATION_UNIT = z.enum(['PERSON', 'ROOM']);

const SLOT = z.object({
  id: z.ulid().optional(),
  name: translatedValue(z.string().min(1)),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable()
    .optional(),
  headcount: COUNT.nullable().optional(),
  supervisorCount: COUNT.nullable().optional(),
  effort: EFFORT.nullable().optional(),
});
const SLOTS = z.array(SLOT).max(50);

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
    supervisorCount: COUNT.optional(),
    eligibility: ELIGIBILITY.optional(),
    effort: EFFORT.optional(),
    defaultRotationUnit: ROTATION_UNIT.optional(),
    balanceCountries: z.boolean().optional(),
    slots: SLOTS.optional(),
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
      supervisorCount: COUNT,
      eligibility: ELIGIBILITY,
      effort: EFFORT,
      defaultRotationUnit: ROTATION_UNIT,
      balanceCountries: z.boolean(),
      slots: SLOTS,
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
