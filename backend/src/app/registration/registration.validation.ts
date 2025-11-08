import { z } from 'zod';
import { BooleanStringSchema, LocaleSchema } from '#core/validation/helper';

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
      customData: z.record(z.string(), z.unknown()),
      waitingList: z.boolean(),
    })
    .partial(),
  query: z
    .object({
      suppressMessage: BooleanStringSchema,
    })
    .partial(),
});

const destroy = z.object({
  params: z.object({
    campId: z.string().ulid(),
    registrationId: z.string().ulid(),
  }),
  query: z
    .object({
      suppressMessage: BooleanStringSchema,
    })
    .partial(),
});

export default {
  show,
  index,
  store,
  update,
  destroy,
};
