import { z } from 'zod';
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
    locale: LocaleSchema.nullable().optional(),
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
      status: z.enum(['PENDING', 'WAITLISTED', 'ACCEPTED']).optional(),
    })
    .partial(),
  query: z
    .object({
      suppressMessage: z.coerce.boolean(),
    })
    .partial(),
});

const destroy = z.object({
  params: z.object({
    campId: z.ulid(),
    registrationId: z.ulid(),
  }),
  query: z
    .object({
      suppressMessage: z.coerce.boolean(),
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
