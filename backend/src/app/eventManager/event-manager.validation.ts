import { z, type ZodType } from 'zod';
import {
  EVENT_MANAGER_ROLES,
  type EventManagerCreateData,
  type EventManagerUpdateData,
} from '@camp-registration/common/entities';

const index = z.object({
  params: z.object({
    eventId: z.ulid(),
  }),
});

const show = z.object({
  params: z.object({
    eventId: z.ulid(),
    eventManagerId: z.ulid(),
  }),
});

const store = z.object({
  params: z.object({
    eventId: z.ulid(),
  }),
  body: z.object({
    email: z.email(),
    role: z.enum(EVENT_MANAGER_ROLES),
    expiresAt: z.iso.datetime().optional(),
  }) satisfies ZodType<EventManagerCreateData>,
});

const update = z.object({
  params: z.object({
    eventId: z.ulid(),
    eventManagerId: z.ulid(),
  }),
  body: z
    .object({
      role: z.enum(EVENT_MANAGER_ROLES),
      expiresAt: z.iso.datetime().nullable(),
    })
    .partial() satisfies ZodType<EventManagerUpdateData>,
});

const destroy = z.object({
  params: z.object({
    eventId: z.ulid(),
    eventManagerId: z.ulid(),
  }),
});

const accept = z.object({
  params: z.object({
    eventManagerId: z.ulid(),
    token: z.ulid(),
  }),
});

export default {
  index,
  show,
  store,
  update,
  destroy,
  accept,
};
