import { z, type ZodType } from 'zod';
import type { NewsletterManagerCreateData } from '@camp-registration/common/entities';

const index = z.object({
  params: z.object({
    newsletterId: z.ulid(),
  }),
});

const store = z.object({
  params: z.object({
    newsletterId: z.ulid(),
  }),
  body: z.object({
    email: z.email(),
    role: z.enum(['OWNER', 'EDITOR', 'VIEWER']).optional(),
  }) satisfies ZodType<NewsletterManagerCreateData>,
});

const destroy = z.object({
  params: z.object({
    newsletterId: z.ulid(),
    newsletterManagerId: z.ulid(),
  }),
});

export default {
  index,
  store,
  destroy,
};
