import { z } from 'zod';

const store = z.object({
  params: z.object({
    campId: z.string(),
    roomId: z.string(),
  }),
  body: z.object({
    registrationId: z.string().optional(),
  }),
});

const update = z.object({
  params: z.object({
    campId: z.string(),
    roomId: z.string(),
    bedId: z.string(),
  }),
  body: z.object({
    registrationId: z.string().nullable(),
  }),
});

const destroy = z.object({
  params: z.object({
    campId: z.string(),
    roomId: z.string(),
    bedId: z.string(),
  }),
});

export default {
  store,
  update,
  destroy,
};
