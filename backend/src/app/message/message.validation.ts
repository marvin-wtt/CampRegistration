import { z } from 'zod';

const show = z.object({
  params: z.object({
    campId: z.string().ulid(),
    messageId: z.string().ulid(),
  }),
});

const index = z.object({
  params: z.object({
    campId: z.string().ulid(),
  }),
  query: z.object({}).partial(),
});

const store = z.object({
  params: z.object({
    campId: z.string().ulid(),
  }),
  body: z.object({
    registrationIds: z.array(z.string().ulid()).min(1),
    subject: z.string().trim().min(1),
    body: z.string().trim().min(1),
    priority: z.enum(['high', 'normal', 'low']).optional(),
    replyTo: z.string().email().optional(),
  }),
  files: z.array(z.custom<Express.Multer.File>()).optional(),
});

const resend = z.object({
  params: z.object({
    campId: z.string().ulid(),
    messageId: z.string().ulid(),
  }),
});

const destroy = z.object({
  params: z.object({
    campId: z.string().ulid(),
    messageId: z.string().ulid(),
  }),
});

export default {
  show,
  index,
  store,
  resend,
  destroy,
};
