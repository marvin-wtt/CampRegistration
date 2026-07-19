import { z, type ZodType } from 'zod';
import { DateSchema } from '#core/validation/helper';
import type {
  TaskCreateData,
  TaskUpdateData,
} from '@camp-registration/common/entities';

const show = z.object({
  params: z.object({
    campId: z.ulid(),
    taskId: z.ulid(),
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
    title: z.string().min(1),
    notes: z.string().optional().nullable(),
    dueDate: DateSchema.optional().nullable(),
    assigneeId: z.ulid().optional().nullable(),
  }) satisfies ZodType<TaskCreateData>,
});

const update = z.object({
  params: z.object({
    campId: z.ulid(),
    taskId: z.ulid(),
  }),
  body: z
    .object({
      title: z.string().min(1),
      notes: z.string().nullable(),
      dueDate: DateSchema.nullable(),
      completed: z.boolean(),
      assigneeId: z.ulid().nullable(),
    })
    .partial() satisfies ZodType<TaskUpdateData>,
});

const destroy = z.object({
  params: z.object({
    campId: z.ulid(),
    taskId: z.ulid(),
  }),
});

export default {
  show,
  index,
  store,
  update,
  destroy,
};
