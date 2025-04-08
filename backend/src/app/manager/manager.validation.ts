import { z } from 'zod';

const index = z.object({
  params: z.object({
    campId: z.string().ulid(),
  }),
});

const store = z.object({
  params: z.object({
    campId: z.string().ulid(),
  }),
  body: z.object({
    email: z.string().email(),
    role: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
  }),
});

const update = z.object({
  params: z.object({
    campId: z.string().ulid(),
    managerId: z.string().ulid(),
  }),
  body: z
    .object({
      role: z.string(),
      expiresAt: z.string().datetime().nullable(),
    })
    .partial(),
});

const destroy = z.object({
  params: z.object({
    campId: z.string().ulid(),
    managerId: z.string().ulid(),
  }),
});

const accept = z.object({
  params: z.object({
    managerId: z.string().ulid(),
    token: z.string().ulid(),
  }),
});

export default {
  index,
  store,
  update,
  destroy,
  accept,
};
