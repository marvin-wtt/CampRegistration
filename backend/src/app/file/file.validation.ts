import { z, type ZodType } from 'zod';
import type { ServiceFileUpdateData } from '@camp-registration/common/entities';

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

// A country an event runs in, as event countries are stored (`gb`, `cz`).
const COUNTRY = z.string().regex(/^[a-z]{2}$/);

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
      country: COUNTRY,
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
    country: COUNTRY.nullable().optional(),
    accessLevel: z.enum(['private', 'public']).optional(),
  }) satisfies ZodType<ServiceFileUpdateData>,
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
    country: COUNTRY.nullable().optional(),
    accessLevel: z.enum(['private', 'public']).optional(),
  }) satisfies ZodType<ServiceFileUpdateData>,
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
