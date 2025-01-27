import { z } from 'zod';
import { translatedValue } from '#core/validation/helper';

const show = z.object({
  params: z.object({
    campId: z.string(),
    messageTemplateId: z.string(),
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
    name: z.string(),
    subject: translatedValue(z.string()),
    body: translatedValue(z.string()),
    priority: z.enum(['low', 'normal', 'high']).optional(),
  }),
});

const update = z.object({
  params: z.object({
    campId: z.string(),
    messageTemplateId: z.string(),
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
    campId: z.string(),
    messageTemplateId: z.string(),
  }),
});

export default {
  show,
  index,
  store,
  update,
  destroy,
};
