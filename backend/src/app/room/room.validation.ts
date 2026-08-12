import z, { type ZodType } from 'zod';
import { translatedValue } from '#core/validation/helper';
import type {
  RoomCreateData,
  RoomUpdateData,
  RoomBulkUpdateData,
} from '@camp-registration/common/entities';

const show = z.object({
  params: z.object({
    campId: z.ulid(),
    roomId: z.ulid(),
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
    name: translatedValue(z.string()),
    capacity: z.number().int().positive().default(1),
  }) satisfies ZodType<RoomCreateData>,
});

const update = z.object({
  params: z.object({
    campId: z.ulid(),
    roomId: z.ulid(),
  }),
  body: z
    .object({
      name: translatedValue(z.string()),
      sortOrder: z.number(),
    })
    .partial() satisfies ZodType<RoomUpdateData>,
});

const bulkUpdate = z.object({
  params: z.object({
    campId: z.ulid(),
  }),
  body: z.object({
    rooms: z
      .array(
        z.object({
          id: z.ulid(),
          name: translatedValue(z.string()).optional(),
          sortOrder: z.number().int().optional(),
        }),
      )
      .min(1),
  }) satisfies ZodType<RoomBulkUpdateData>,
});

const destroy = z.object({
  params: z.object({
    campId: z.ulid(),
    roomId: z.ulid(),
  }),
});

export default {
  show,
  index,
  store,
  update,
  bulkUpdate,
  destroy,
};
