import { z, type ZodType } from 'zod';
import type { NewsletterMessageCreateData } from '@camp-registration/common/entities';

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
    subject: z.string().min(1).max(255),
    body: z.string().min(1),
    attachmentIds: z.array(z.ulid()).optional(),
  }) satisfies ZodType<NewsletterMessageCreateData>,
});

const destroy = z.object({
  params: z.object({
    newsletterId: z.ulid(),
    newsletterMessageId: z.ulid(),
  }),
});

export default {
  index,
  store,
  destroy,
};
