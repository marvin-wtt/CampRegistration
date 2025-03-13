import { z } from 'zod';

const show = z.object({
  params: z.object({
    campId: z.string(),
    messageId: z.string(),
  }),
});

const index = z.object({
  params: z.object({
    campId: z.string(),
  }),
  query: z.object({}).partial(),
});

const store = z.object({
  params: z.object({
    campId: z.string(),
  }),
  body: z.object({
    registrationIds: z.array(z.string()).min(1),
    subject: z.string(),
    body: z.string(),
    priority: z.string(),
    replyTo: z.string().email().optional(),
  }),
});

const resend = z.object({
  params: z.object({
    campId: z.string(),
    messageId: z.string(),
  }),
});

const destroy = z.object({
  params: z.object({
    campId: z.string(),
    messageId: z.string(),
  }),
});

export default {
  show,
  index,
  store,
  resend,
  destroy,
};
