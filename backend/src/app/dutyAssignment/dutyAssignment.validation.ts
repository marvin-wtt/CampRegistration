import { z, type ZodType } from 'zod';
import { DateSchema } from '#core/validation/helper';
import type {
  DutyAssignmentCreateData,
  DutyAssignmentUpdateData,
} from '@camp-registration/common/entities';

const show = z.object({
  params: z.object({
    eventId: z.ulid(),
    dutyAssignmentId: z.ulid(),
  }),
});

const index = z.object({
  params: z.object({
    eventId: z.ulid(),
  }),
});

const ROTATION_UNIT = z.enum(['PARTICIPANT', 'ROOM']);

const suggestions = z.object({
  params: z.object({
    eventId: z.ulid(),
  }),
  query: z.object({
    dutyId: z.ulid(),
    unit: ROTATION_UNIT,
  }),
});

const store = z.object({
  params: z.object({
    eventId: z.ulid(),
  }),
  body: z.object({
    dutyId: z.ulid(),
    rotationUnit: ROTATION_UNIT,
    date: DateSchema,
    slot: z.string().min(1).optional().nullable(),
    registrationIds: z.array(z.ulid()).optional(),
  }) satisfies ZodType<DutyAssignmentCreateData>,
});

const update = z.object({
  params: z.object({
    eventId: z.ulid(),
    dutyAssignmentId: z.ulid(),
  }),
  body: z
    .object({
      dutyId: z.ulid(),
      rotationUnit: ROTATION_UNIT,
      date: DateSchema,
      slot: z.string().min(1).nullable(),
      registrationIds: z.array(z.ulid()),
    })
    .partial() satisfies ZodType<DutyAssignmentUpdateData>,
});

const destroy = z.object({
  params: z.object({
    eventId: z.ulid(),
    dutyAssignmentId: z.ulid(),
  }),
});

export default {
  show,
  index,
  suggestions,
  store,
  update,
  destroy,
};
