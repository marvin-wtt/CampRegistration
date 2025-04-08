import { z } from 'zod';

const stream = z.object({
  params: z.object({
    fileId: z.string().ulid(),
  }),
  query: z
    .object({
      download: z.boolean(),
    })
    .partial(),
});

const show = z.object({
  params: z.object({
    fileId: z.string().ulid(),
  }),
});

const index = z.object({
  query: z
    .object({
      page: z.number().int().positive(),
      name: z.string(),
      type: z.string(),
    })
    .partial(),
});

const store = z.object({
  body: z.object({
    name: z.string().optional(),
    field: z.string().optional(),
    accessLevel: z.string().optional(),
  }),
});

const destroy = z.object({
  params: z.object({
    fileId: z.string().ulid(),
  }),
});

export default {
  stream,
  show,
  index,
  store,
  destroy,
};
