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
    consentedAt: z
      .union([z.iso.date(), z.iso.datetime({ offset: true })])
      // A day of slack: a plain date is UTC midnight, ahead of zones east of UTC.
      .refine((value) => new Date(value).getTime() <= Date.now() + 86_400_000, {
        message: 'The consent date cannot be in the future.',
      })
      .optional(),
  }) satisfies ZodType<NewsletterSubscriberCreateData>,
});

const importFromEventBody = z.object({
  eventId: z.ulid(),
  group: z.string().max(5).nullable().optional(),
}) satisfies ZodType<NewsletterSubscriberImportData>;

const importFromEvent = z.object({
  params: z.object({
    newsletterId: z.ulid(),
  }),
  body: importFromEventBody,
});

const destroy = z.object({
  params: z.object({
    newsletterId: z.ulid(),
    newsletterSubscriberId: z.ulid(),
  }),
});

const resendConfirmation = z.object({
  params: z.object({
    newsletterId: z.ulid(),
    newsletterSubscriberId: z.ulid(),
  }),
});

const confirmation = z.object({
  params: z.object({
    token: z.string().length(64),
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
  importFromEvent,
  resendConfirmation,
  destroy,
  confirmation,
  unsubscribe,
};
