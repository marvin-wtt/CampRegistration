import { z } from 'zod';

const index = z.object({
  query: z
    .object({
      view: z.enum(['all', 'assigned']).optional(),
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
    replyTo: z.email().max(255).nullable().optional(),
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
      replyTo: z.email().max(255).nullable(),
    })
    .partial(),
});

const destroy = z.object({
  params: z.object({
    newsletterId: z.ulid(),
  }),
});

export default {
  index,
  show,
  store,
  update,
  destroy,
};
