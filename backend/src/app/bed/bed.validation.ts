import { z } from 'zod';

const store = z.object({
  params: z.object({
    campId: z.string().ulid(),
    roomId: z.string().ulid(),
  }),
  body: z.object({
    registrationId: z.string().ulid().optional(),
  }),
});

const update = z.object({
  params: z.object({
    campId: z.string().ulid(),
    roomId: z.string().ulid(),
    bedId: z.string().ulid(),
  }),
  body: z.object({
    registrationId: z.string().ulid().nullable(),
  }),
});

const destroy = z.object({
  params: z.object({
    campId: z.string().ulid(),
    roomId: z.string().ulid(),
    bedId: z.string().ulid(),
  }),
});

export default {
  store,
  update,
  destroy,
};
