import { z, type ZodType } from 'zod';
import { translatedValue } from '#core/validation/helper';
import type {
  MessageTemplateCreateData,
  MessageTemplateUpdateData,
  MessageTemplateQuery,
} from '@camp-registration/common/entities';

const show = z.object({
  params: z.object({
    campId: z.string().ulid(),
    messageTemplateId: z.string().ulid(),
  }),
});

const index = z.object({
  params: z.object({
    campId: z.string().ulid(),
  }),
  query: z
    .object({
      includeDefaults: z.coerce.boolean().optional(),
      hasEvent: z.coerce.boolean().optional(),
    })
    .partial() satisfies ZodType<MessageTemplateQuery>,
});

const store = z.object({
  params: z.object({
    campId: z.string().ulid(),
  }),
  body: z.object({
    event: z.string(),
    subject: translatedValue(z.string()),
    body: translatedValue(z.string()),
    priority: z.enum(['low', 'normal', 'high']).optional(),
  }) satisfies ZodType<MessageTemplateCreateData>,
});

const update = z.object({
  params: z.object({
    campId: z.string().ulid(),
    messageTemplateId: z.string().ulid(),
  }),
  body: z
    .object({
      subject: translatedValue(z.string()),
      body: translatedValue(z.string()),
      priority: z.enum(['low', 'normal', 'high']),
    })
    .partial() satisfies ZodType<MessageTemplateUpdateData>,
});

const destroy = z.object({
  params: z.object({
    campId: z.string().ulid(),
    messageTemplateId: z.string().ulid(),
  }),
});

export default {
  show,
  index,
  store,
  update,
  destroy,
};
