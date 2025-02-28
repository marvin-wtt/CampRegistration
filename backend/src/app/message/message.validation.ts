import { z } from 'zod';
import { translatedValue } from '#core/validation/helper';

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
  body: z.object({}),
});

const update = z.object({
  params: z.object({
    campId: z.string(),
    messageId: z.string(),
  }),
  body: z.object({}).partial(),
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
  update,
  destroy,
};
