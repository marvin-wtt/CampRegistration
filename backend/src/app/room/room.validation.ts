import z from 'zod';
import { translatedValue } from '#core/validation/helper';

const show = z.object({
  params: z.object({
    campId: z.string(),
    roomId: z.string(),
  }),
});

const index = z.object({
  params: z.object({
    campId: z.string(),
  }),
});

const store = z.object({
  params: z.object({
    campId: z.string(),
  }),
  body: z.object({
    name: translatedValue(z.string()),
    capacity: z.number().int().positive().default(1),
  }),
});

const update = z.object({
  params: z.object({
    campId: z.string(),
    roomId: z.string(),
  }),
  body: z
    .object({
      name: translatedValue(z.string()),
    })
    .partial(),
});

const destroy = z.object({
  params: z.object({
    campId: z.string(),
    roomId: z.string(),
  }),
});

export default {
  show,
  index,
  store,
  update,
  destroy,
};
