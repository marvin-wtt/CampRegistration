import { z } from 'zod';

const store = z.object({
  params: z.object({
    campId: z.ulid(),
    roomId: z.ulid(),
  }),
  body: z.object({
    registrationId: z.ulid().optional(),
  }),
});

const update = z.object({
  params: z.object({
    campId: z.ulid(),
    roomId: z.ulid(),
    bedId: z.ulid(),
  }),
  body: z.object({
    registrationId: z.ulid().nullable(),
  }),
});

const destroy = z.object({
  params: z.object({
    campId: z.ulid(),
    roomId: z.ulid(),
    bedId: z.ulid(),
  }),
});

export default {
  store,
  update,
  destroy,
};
