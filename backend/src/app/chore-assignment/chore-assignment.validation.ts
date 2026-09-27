import { z, type ZodType } from 'zod';
import { DateSchema } from '#core/validation/helper';
import type {
  ChoreAssignmentBulkDeleteQuery,
  ChoreAssignmentCreateData,
  ChoreAssignmentMemberData,
  ChoreAssignmentUpdateData,
  ChoreAutoFillData,
  ChoreMemberRemovalQuery,
  ChoreSeriesPlanData,
} from '@camp-registration/common/entities';

// Roughly a year — longer ranges are a typo, not a camp.
const MAX_SERIES_DAYS = 400;

const ROTATION_UNIT = z.enum(['PERSON', 'ROOM']);
const ROLE = z.enum(['MEMBER', 'SUPERVISOR']);
const STATUS = z.enum(['PLANNED', 'DONE', 'CANCELLED']);

const MEMBERS = z
  .array(
    z.object({
      registrationId: z.ulid(),
      role: ROLE.optional(),
      missed: z.boolean().optional(),
    }) satisfies ZodType<ChoreAssignmentMemberData>,
  )
  .max(500);

const eventParams = z.object({
  eventId: z.ulid(),
});

const assignmentParams = z.object({
  eventId: z.ulid(),
  choreAssignmentId: z.ulid(),
});

const show = z.object({
  params: assignmentParams,
});

const index = z.object({
  params: eventParams,
});

const suggestions = z.object({
  params: eventParams,
  query: z.object({
    choreId: z.ulid(),
    unit: ROTATION_UNIT,
    role: ROLE.default('MEMBER'),
    date: DateSchema.optional(),
    assignmentId: z.ulid().optional(),
  }),
});

const fairness = z.object({
  params: eventParams,
});

const autoFill = z.object({
  params: eventParams,
  body: z.object({
    choreId: z.ulid(),
    slotId: z.ulid().nullable().optional(),
    date: DateSchema,
    rotationUnit: ROTATION_UNIT,
    headcount: z.number().int().min(0).max(500).optional(),
    supervisorCount: z.number().int().min(0).max(100).optional(),
    members: MEMBERS,
    assignmentId: z.ulid().optional(),
  }) satisfies ZodType<ChoreAutoFillData>,
});

const store = z.object({
  params: eventParams,
  body: z.object({
    choreId: z.ulid(),
    slotId: z.ulid().nullable().optional(),
    rotationUnit: ROTATION_UNIT,
    date: DateSchema,
    note: z.string().trim().max(500).nullable().optional(),
    members: MEMBERS.optional(),
    autoFill: z.boolean().optional(),
  }) satisfies ZodType<ChoreAssignmentCreateData>,
});

const series = z.object({
  params: eventParams,
  body: z
    .object({
      choreId: z.ulid(),
      slotIds: z.array(z.ulid()).max(50),
      from: DateSchema,
      to: DateSchema,
      weekdays: z.array(z.number().int().min(0).max(6)).min(1).optional(),
      rotationUnit: ROTATION_UNIT,
      onConflict: z.enum(['SKIP', 'FILL', 'REPLACE']),
    })
    .refine((data) => data.from <= data.to, {
      message: 'The end date must not be before the start date',
      path: ['to'],
    })
    .refine((data) => daysBetween(data.from, data.to) <= MAX_SERIES_DAYS, {
      message: 'The date range is too long',
      path: ['to'],
    }) satisfies ZodType<ChoreSeriesPlanData>,
});

const destroyMany = z.object({
  params: eventParams,
  query: z
    .object({
      batchId: z.ulid().optional(),
      // Comma-separated, as Express' default query parser has no arrays.
      choreId: z
        .string()
        .transform((value) => value.split(',').map((id) => id.trim()))
        .pipe(z.array(z.ulid()).nonempty())
        .optional(),
      slotId: z.ulid().optional(),
      from: DateSchema.optional(),
      to: DateSchema.optional(),
    })
    // Never "delete everything" by accident.
    .refine((query) => Object.values(query).length > 0, {
      message: 'At least one filter is required',
    }) satisfies ZodType<ChoreAssignmentBulkDeleteQuery>,
});

const destroyMember = z.object({
  params: eventParams.extend({
    registrationId: z.ulid(),
  }),
  query: z
    .object({
      from: DateSchema,
      to: DateSchema.optional(),
      replace: z.stringbool(),
    })
    .refine((data) => !data.to || data.from <= data.to, {
      message: 'The end date must not be before the start date',
      path: ['to'],
    }) satisfies ZodType<ChoreMemberRemovalQuery>,
});

const update = z.object({
  params: assignmentParams,
  body: z
    .object({
      choreId: z.ulid(),
      slotId: z.ulid().nullable(),
      rotationUnit: ROTATION_UNIT,
      date: DateSchema,
      status: STATUS,
      note: z.string().trim().max(500).nullable(),
      members: MEMBERS,
    })
    .partial() satisfies ZodType<ChoreAssignmentUpdateData>,
});

const fill = z.object({
  params: assignmentParams,
});

const destroy = z.object({
  params: assignmentParams,
});

function daysBetween(from: string, to: string): number {
  return (Date.parse(to) - Date.parse(from)) / (24 * 60 * 60 * 1000);
}

export default {
  show,
  index,
  suggestions,
  fairness,
  autoFill,
  store,
  series,
  destroyMany,
  destroyMember,
  update,
  fill,
  destroy,
};
