import { z } from 'zod';

const index = z.object({
  params: z.object({
    campId: z.ulid(),
  }),
});

const show = z.object({
  params: z.object({
    campId: z.ulid(),
    campManagerId: z.ulid(),
  }),
});

const store = z.object({
  params: z.object({
    campId: z.ulid(),
  }),
  body: z.object({
    email: z.email(),
    role: z.enum(['DIRECTOR', 'COORDINATOR', 'COUNSELOR', 'VIEWER']),
    expiresAt: z.iso.datetime().optional(),
  }),
});

const update = z.object({
  params: z.object({
    campId: z.ulid(),
    campManagerId: z.ulid(),
  }),
  body: z
    .object({
      role: z.enum(['DIRECTOR', 'COORDINATOR', 'COUNSELOR', 'VIEWER']),
      expiresAt: z.iso.datetime().nullable(),
    })
    .partial(),
});

const destroy = z.object({
  params: z.object({
    campId: z.ulid(),
    campManagerId: z.ulid(),
  }),
});

const accept = z.object({
  params: z.object({
    campManagerId: z.ulid(),
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
