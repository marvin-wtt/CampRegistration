import { z } from 'zod';

const index = z.object({
  query: z
    .object({
      showAll: z.coerce.boolean().optional(),
    })
    .optional(),
});

const show = z.object({
  params: z.object({
    newsletterId: z.ulid(),
  }),
});

const store = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(5000).nullable().optional(),
  }),
});

const update = z.object({
  params: z.object({
    newsletterId: z.ulid(),
  }),
  body: z
    .object({
      name: z.string().min(1).max(255),
      description: z.string().max(5000).nullable(),
    })
    .partial(),
});

const destroy = z.object({
  params: z.object({
    newsletterId: z.ulid(),
  }),
});

const send = z.object({
  params: z.object({
    newsletterId: z.ulid(),
  }),
  body: z.object({
    subject: z.string().min(1).max(255),
    body: z.string().min(1),
  }),
});

export default {
  index,
  show,
  store,
  update,
  destroy,
  send,
};
