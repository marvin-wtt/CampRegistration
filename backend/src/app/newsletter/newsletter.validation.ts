import { z, type ZodType } from 'zod';
import type {
  NewsletterCreateData,
  NewsletterUpdateData,
  NewsletterQuery,
} from '@camp-registration/common/entities';

const index = z.object({
  query: z
    .object({
      view: z.enum(['all', 'assigned']),
      name: z.string(),
      cursor: z.ulid(),
      limit: z.coerce.number().int().positive().max(100),
      sortBy: z.enum(['name', 'createdAt', 'updatedAt']),
      sortType: z.enum(['asc', 'desc']),
    })
    .partial()
    .optional() satisfies ZodType<NewsletterQuery | undefined>,
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
  }) satisfies ZodType<NewsletterCreateData>,
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
    .partial() satisfies ZodType<NewsletterUpdateData>,
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
