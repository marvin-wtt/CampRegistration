import { z } from 'zod';
import { LocaleSchema } from '#core/validation/helper';
import { formUtils } from '#utils/form';

type CampWithFreePlaces = Parameters<typeof formUtils>[0];

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

const store = (camp: CampWithFreePlaces) =>
  z.object({
    params: z.object({
      campId: z.ulid(),
    }),
    body: z.object({
      data: RegistrationDataSchema.superRefine((data, ctx) => {
        const form = formUtils(camp, data);

        if (form.hasDataErrors()) {
          ctx.addIssue({
            code: 'custom',
            message: `Invalid survey data: ${form.getDataErrorFields()}`,
          });
          return;
        }

        const unknownFields = form.unknownDataFields();
        if (unknownFields.length > 0) {
          ctx.addIssue({
            code: 'custom',
            message: `Unknown fields '${unknownFields.join(', ')}'`,
          });
        }
      }),
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
      customFiles: z.record(z.string().regex(/^[^\s.]+$/), z.ulid().nullable()),
      status: z.enum(['PENDING', 'WAITLISTED', 'ACCEPTED']).optional(),
    })
    .partial(),
  query: z
    .object({
      suppressMessage: z.stringbool(),
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
      suppressMessage: z.stringbool(),
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
