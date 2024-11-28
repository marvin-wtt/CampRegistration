import { z } from 'zod';

const index = z.object({
  params: z.object({
    campId: z.string(),
  }),
});

const store = z.object({
  params: z.object({
    campId: z.string(),
  }),
  body: z.object({
    email: z.string().email(),
    role: z.string().optional(),
  }),
});

const update = z.object({
  params: z.object({
    campId: z.string(),
    managerId: z.string(),
  }),
  body: z
    .object({
      role: z.string(),
    })
    .partial(),
});

const destroy = z.object({
  params: z.object({
    campId: z.string(),
    managerId: z.string(),
  }),
});

const accept = z.object({
  params: z.object({
    managerId: z.string(),
    token: z.string(),
  }),
});

export default {
  index,
  store,
  update,
  destroy,
  accept,
};
