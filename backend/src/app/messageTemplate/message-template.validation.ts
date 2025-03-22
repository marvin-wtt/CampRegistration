import { z } from 'zod';
import { translatedValue } from '#core/validation/helper';

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
    })
    .partial(),
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
  }),
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
    .partial(),
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
