import { z, type ZodType } from 'zod';
import type {
  MessageCreateData,
  MessagePreviewData,
} from '@camp-registration/common/entities';

const show = z.object({
  params: z.object({
    eventId: z.ulid(),
    messageId: z.ulid(),
  }),
});

const index = z.object({
  params: z.object({
    eventId: z.ulid(),
  }),
  query: z.object({}).partial(),
});

const store = z.object({
  params: z.object({
    eventId: z.ulid(),
  }),
  body: z.object({
    registrationIds: z.array(z.ulid()).min(1),
    subject: z.string().trim().min(1),
    body: z.string().trim().min(1),
    priority: z.enum(['high', 'normal', 'low']).optional(),
    replyTo: z.email().optional(),
    attachmentIds: z.array(z.ulid()).optional(),
  }) satisfies ZodType<MessageCreateData>,
});

const preview = z.object({
  params: z.object({
    eventId: z.ulid(),
  }),
  body: z.object({
    registrationId: z.ulid(),
    subject: z.string().trim().min(1),
    body: z.string().trim().min(1),
  }) satisfies ZodType<MessagePreviewData>,
});

const resend = z.object({
  params: z.object({
    eventId: z.ulid(),
    messageId: z.ulid(),
  }),
});

const destroy = z.object({
  params: z.object({
    eventId: z.ulid(),
    messageId: z.ulid(),
  }),
});

const duplicateAttachments = z.object({
  params: z.object({
    eventId: z.ulid(),
    messageId: z.ulid(),
  }),
});

export default {
  show,
  index,
  store,
  preview,
  resend,
  destroy,
  duplicateAttachments,
};
