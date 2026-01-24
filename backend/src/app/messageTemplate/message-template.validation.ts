import { z, type ZodType } from 'zod';
import type {
  MessageTemplateCreateData,
  MessageTemplateUpdateData,
  MessageTemplateQuery,
} from '@camp-registration/common/entities';

const show = z.object({
  params: z.object({
    campId: z.ulid(),
    messageTemplateId: z.ulid(),
  }),
});

const index = z.object({
  params: z.object({
    campId: z.ulid(),
  }),
  query: z
    .object({
      hasEvent: z.coerce.boolean().optional(),
    })
    .partial() satisfies ZodType<MessageTemplateQuery>,
});

const store = z.object({
  params: z.object({
    campId: z.ulid(),
  }),
  body: z.object({
    country: z.string().length(2),
    event: z.string(),
    subject: z.string(),
    body: z.string(),
    priority: z.enum(['low', 'normal', 'high']).optional(),
    attachmentIds: z.array(z.ulid()).optional(),
  }) satisfies ZodType<MessageTemplateCreateData>,
});

const update = z.object({
  params: z.object({
    campId: z.ulid(),
    messageTemplateId: z.ulid(),
  }),
  body: z
    .object({
      subject: z.string(),
      body: z.string(),
      priority: z.enum(['low', 'normal', 'high']),
      attachmentIds: z.array(z.ulid()),
    })
    .partial() satisfies ZodType<MessageTemplateUpdateData>,
});

const destroy = z.object({
  params: z.object({
    campId: z.ulid(),
    messageTemplateId: z.ulid(),
  }),
});

export default {
  show,
  index,
  store,
  update,
  destroy,
};
