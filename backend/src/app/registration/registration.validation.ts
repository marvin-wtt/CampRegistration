import { z } from 'zod/v4';
import { LocaleSchema } from '#core/validation/helper';

const RegistrationDataSchema = z.record(z.string(), z.unknown());

const index = z.object({
  params: z.object({
    campId: z.ulid(),
  }),
});

const show = z.object({
  params: z.object({
    campId: z.ulid(),
    registrationId: z.ulid(),
  }),
});

const store = z.object({
  params: z.object({
    campId: z.ulid(),
  }),
  body: z.object({
    data: RegistrationDataSchema,
    locale: LocaleSchema.optional(),
  }),
});

const update = z.object({
  params: z.object({
    campId: z.ulid(),
    registrationId: z.ulid(),
  }),
  body: z
    .object({
      data: RegistrationDataSchema,
      customData: z.record(z.string(), z.unknown()),
      waitingList: z.boolean(),
    })
    .partial(),
});

const destroy = z.object({
  params: z.object({
    campId: z.ulid(),
    registrationId: z.ulid(),
  }),
});

export default {
  show,
  index,
  store,
  update,
  destroy,
};
