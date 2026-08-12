import { z, type ZodType } from 'zod';
import type {
  NewsletterSubscriberCreateData,
  NewsletterSubscriberImportData,
} from '@camp-registration/common/entities';

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
    name: z.string().max(255).nullable().optional(),
  }) satisfies ZodType<NewsletterSubscriberCreateData>,
});

const importFromCamp = z.object({
  params: z.object({
    newsletterId: z.ulid(),
  }),
  body: z.object({
    campId: z.ulid(),
    country: z.string().max(5).nullable().optional(),
    requireConsent: z.boolean().optional(),
  }) satisfies ZodType<NewsletterSubscriberImportData>,
});

const destroy = z.object({
  params: z.object({
    newsletterId: z.ulid(),
    newsletterSubscriberId: z.ulid(),
  }),
});

const unsubscribe = z.object({
  params: z.object({
    token: z.string().length(64),
  }),
});

export default {
  index,
  store,
  importFromCamp,
  destroy,
  unsubscribe,
};
