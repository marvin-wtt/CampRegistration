import { z } from 'zod';

const RegistrationDataSchema = z.record(z.string(), z.unknown());

const index = z.object({
  params: z.object({
    campId: z.string(),
  }),
});

const show = z.object({
  params: z.object({
    campId: z.string(),
    registrationId: z.string(),
  }),
});

const store = z.object({
  params: z.object({
    campId: z.string(),
  }),
  body: z.object({
    data: RegistrationDataSchema,
    locale: z
      .string()
      .regex(/^[a-z]{2}(?:[_-][A-Z]{2})?$/)
      .optional(),
  }),
});

const update = z.object({
  params: z.object({
    campId: z.string(),
    registrationId: z.string(),
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
    campId: z.string(),
    registrationId: z.string(),
  }),
});

export default {
  show,
  index,
  store,
  update,
  destroy,
};
