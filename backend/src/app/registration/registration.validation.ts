import { z, type ZodType } from 'zod';
import { LocaleSchema } from '#core/validation/helper';
import { RegistrationForm } from '#app/registration/registration.form';
import {
  REGISTRATION_DELETE_REASONS,
  type RegistrationCreateData,
  type RegistrationUpdateData,
  type RegistrationUpdateQuery,
  type RegistrationDeleteQuery,
} from '@camp-registration/common/entities';
import type { EventWithRelations } from '#app/event/event.types';

const RegistrationDataSchema = z.record(z.string(), z.unknown());

const index = z.object({
  params: z.object({
    eventId: z.ulid(),
  }),
});

const show = z.object({
  params: z.object({
    eventId: z.ulid(),
    registrationId: z.ulid(),
  }),
});

// `fallbackLocale` resolves a missing body locale here, once, so the errors and
// the stored registration share the language the registrant is answered in.
const store = (event: EventWithRelations, fallbackLocale: string) =>
  z.object({
    params: z.object({
      eventId: z.ulid(),
    }),
    body: z
      .object({
        data: RegistrationDataSchema,
        locale: LocaleSchema.nullable()
          .optional()
          .transform((locale) => locale ?? fallbackLocale),
      })
      .superRefine(async ({ data, locale }, ctx) => {
        const form = new RegistrationForm(event, { locale }).load(data);

        for (const error of await form.dataErrors()) {
          ctx.addIssue({
            code: 'custom',
            path: ['data'],
            message: `${error.message} '${error.path}'`,
          });
        }
      }) satisfies ZodType<RegistrationCreateData>,
  });

const update = z.object({
  params: z.object({
    eventId: z.ulid(),
    registrationId: z.ulid(),
  }),
  body: z
    .object({
      data: RegistrationDataSchema,
      customData: z.record(z.string(), z.unknown()),
      customFiles: z.record(z.string().regex(/^[^\s.]+$/), z.ulid().nullable()),
      status: z.enum(['PENDING', 'WAITLISTED', 'ACCEPTED']).optional(),
    })
    .partial() satisfies ZodType<RegistrationUpdateData>,
  query: z
    .object({
      suppressMessage: z.stringbool(),
    })
    .partial() satisfies ZodType<RegistrationUpdateQuery>,
});

const destroy = z.object({
  params: z.object({
    eventId: z.ulid(),
    registrationId: z.ulid(),
  }),
  query: z
    .object({
      suppressMessage: z.stringbool(),
      reason: z.enum(REGISTRATION_DELETE_REASONS),
    })
    .partial() satisfies ZodType<RegistrationDeleteQuery>,
});

export default {
  show,
  index,
  store,
  update,
  destroy,
};
