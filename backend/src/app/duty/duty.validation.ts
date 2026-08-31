import { z, type ZodType } from 'zod';
import { translatedValue } from '#core/validation/helper';
import type {
  DutyCreateData,
  DutyUpdateData,
} from '@camp-registration/common/entities';

const ROTATION_UNIT = z.enum(['PARTICIPANT', 'ROOM']);
const DEFAULT_COUNT = z.number().int().positive().nullable();

const show = z.object({
  params: z.object({
    eventId: z.ulid(),
    dutyId: z.ulid(),
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
    rotationUnit: ROTATION_UNIT.optional(),
    defaultCount: DEFAULT_COUNT.optional(),
  }) satisfies ZodType<DutyCreateData>,
});

const update = z.object({
  params: z.object({
    eventId: z.ulid(),
    dutyId: z.ulid(),
  }),
  body: z
    .object({
      name: translatedValue(z.string().min(1)),
      sortOrder: z.number().int(),
      rotationUnit: ROTATION_UNIT,
      defaultCount: DEFAULT_COUNT,
    })
    .partial() satisfies ZodType<DutyUpdateData>,
});

const destroy = z.object({
  params: z.object({
    eventId: z.ulid(),
    dutyId: z.ulid(),
  }),
});

export default {
  show,
  index,
  store,
  update,
  destroy,
};
