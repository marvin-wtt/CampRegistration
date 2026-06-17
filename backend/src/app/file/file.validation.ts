import { z } from 'zod';

const stream = z.object({
  params: z.object({
    fileId: z.ulid(),
  }),
  query: z
    .object({
      download: z.boolean(),
    })
    .partial(),
});

const show = z.object({
  params: z.object({
    fileId: z.ulid(),
  }),
});

const slotFile = z.object({
  params: z.object({
    slot: z.string().min(1),
  }),
  query: z
    .object({
      locale: z.string(),
    })
    .partial(),
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
    locale: z.string().nullable().optional(),
    accessLevel: z.string().optional(),
  }),
  file: z.custom<Express.Multer.File>((file) => {
    return file !== undefined;
  }),
});

const update = z.object({
  params: z.object({
    fileId: z.ulid(),
  }),
  body: z.object({
    name: z.string().optional(),
    field: z.string().optional(),
    locale: z.string().nullable().optional(),
    accessLevel: z.string().optional(),
  }),
});

const destroy = z.object({
  params: z.object({
    fileId: z.ulid(),
  }),
});

export default {
  stream,
  show,
  slotFile,
  index,
  store,
  update,
  destroy,
};
