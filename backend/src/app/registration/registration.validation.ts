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
import { eventCountry } from '@camp-registration/common/utils';

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
        // Defaults to the only country; required when there are several.
        group: z
          .string()
          .toLowerCase()
          .refine((group) => event.countries.includes(group), {
            message: 'Group is not one of the event countries',
          })
          .nullable()
          .optional()
          .transform((group) => eventCountry(event, group)),
      })
      .superRefine(async ({ data, locale, group }, ctx) => {
        if (event.countries.length > 1 && !group) {
          // Only a page loaded before the group step existed sends none.
          ctx.addIssue({
            code: 'custom',
            path: ['group'],
            message: 'A group is required. Please reload the page.',
          });
          return;
        }

        const form = new RegistrationForm(event, { locale, group }).load(data);

        for (const error of await form.dataErrors()) {
          ctx.addIssue({
            code: 'custom',
            path: ['data'],
            message: `${error.message} '${error.path}'`,
          });
        }
      }) satisfies ZodType<RegistrationCreateData>,
  });

const update = (event: EventWithRelations) =>
  z.object({
    params: z.object({
      eventId: z.ulid(),
      registrationId: z.ulid(),
    }),
    body: z
      .object({
        data: RegistrationDataSchema,
        customData: z.record(z.string(), z.unknown()),
        customFiles: z.record(
          z.string().regex(/^[^\s.]+$/),
          z.ulid().nullable(),
        ),
        status: z.enum(['PENDING', 'WAITLISTED', 'ACCEPTED']).optional(),
        // A manager moving the registration; the answers stay as given.
        group: z
          .string()
          .toLowerCase()
          .refine((group) => event.countries.includes(group), {
            message: 'Group is not one of the event countries',
          }),
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
