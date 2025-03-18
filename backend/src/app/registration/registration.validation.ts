import { z } from 'zod';
import { LocaleSchema } from '#core/validation/helper.js';

const RegistrationDataSchema = z.record(z.string(), z.unknown());

const index = z.object({
  params: z.object({
    campId: z.string().ulid(),
  }),
});

const show = z.object({
  params: z.object({
    campId: z.string().ulid(),
    registrationId: z.string().ulid(),
  }),
});

const store = z.object({
  params: z.object({
    campId: z.string().ulid(),
  }),
  body: z.object({
    data: RegistrationDataSchema,
    locale: LocaleSchema.optional(),
  }),
});

const update = z.object({
  params: z.object({
    campId: z.string().ulid(),
    registrationId: z.string().ulid(),
  }),
  body: z
    .object({
      data: RegistrationDataSchema,
      waitingList: z.boolean(),
    })
    .partial(),
});

const destroy = z.object({
  params: z.object({
    campId: z.string().ulid(),
    registrationId: z.string().ulid(),
  }),
});

export default {
  show,
  index,
  store,
  update,
  destroy,
};
