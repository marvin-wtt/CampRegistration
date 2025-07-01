import z from 'zod/v4';
import { translatedValue } from '#core/validation/helper';

const show = z.object({
  params: z.object({
    campId: z.ulid(),
    roomId: z.ulid(),
  }),
});

const index = z.object({
  params: z.object({
    campId: z.ulid(),
  }),
});

const store = z.object({
  params: z.object({
    campId: z.ulid(),
  }),
  body: z.object({
    name: translatedValue(z.string()),
    capacity: z.number().int().positive().default(1),
  }),
});

const update = z.object({
  params: z.object({
    campId: z.ulid(),
    roomId: z.ulid(),
  }),
  body: z
    .object({
      name: translatedValue(z.string()),
    })
    .partial(),
});

const destroy = z.object({
  params: z.object({
    campId: z.ulid(),
    roomId: z.ulid(),
  }),
});

export default {
  show,
  index,
  store,
  update,
  destroy,
};
