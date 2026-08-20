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
    consentConfirmed: z.boolean().refine((value) => value, {
      message: 'The subscriber must have agreed to receive this newsletter.',
    }),
  }) satisfies ZodType<NewsletterSubscriberCreateData>,
});

const importFromCampBody = z.object({
  campId: z.ulid(),
  country: z.string().max(5).nullable().optional(),
  requireConsent: z.boolean().optional(),
  consentConfirmed: z.boolean().optional(),
}) satisfies ZodType<NewsletterSubscriberImportData>;

const importFromCamp = z.object({
  params: z.object({
    newsletterId: z.ulid(),
  }),
  body: importFromCampBody.refine(
    (body) => body.requireConsent === true || body.consentConfirmed === true,
    {
      path: ['consentConfirmed'],
      message:
        'Importing registrations without explicit newsletter consent requires confirming that they agreed to be added.',
    },
  ),
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
