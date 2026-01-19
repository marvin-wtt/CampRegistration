import { z } from 'zod';

const show = z.object({
  params: z.object({
    campId: z.ulid(),
    messageId: z.ulid(),
  }),
});

const index = z.object({
  params: z.object({
    campId: z.ulid(),
  }),
  query: z.object({}).partial(),
});

const store = z.object({
  params: z.object({
    campId: z.ulid(),
  }),
  body: z.object({
    registrationIds: z.array(z.ulid()).min(1),
    subject: z.string().trim().min(1),
    body: z.string().trim().min(1),
    priority: z.enum(['high', 'normal', 'low']).optional(),
    replyTo: z.email().optional(),
    attachmentIds: z.array(z.ulid()).optional(),
  }),
});

const resend = z.object({
  params: z.object({
    campId: z.ulid(),
    messageId: z.ulid(),
  }),
});

const destroy = z.object({
  params: z.object({
    campId: z.ulid(),
    messageId: z.ulid(),
  }),
});

export default {
  show,
  index,
  store,
  resend,
  destroy,
};
