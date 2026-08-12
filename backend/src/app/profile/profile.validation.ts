import { z, type ZodType } from 'zod';
import { LocaleSchema, PasswordSchema } from '#core/validation/helper';
import type { ProfileUpdateData } from '@camp-registration/common/entities';

const update = z.object({
  body: z
    .object({
      email: z.email(),
      password: PasswordSchema,
      currentPassword: z.string(),
      name: z.string(),
      locale: LocaleSchema,
    })
    .strict()
    .partial()
    .superRefine((val, ctx) => {
      const passwordRequired = val.password ?? val.email;
      if (passwordRequired && !val.currentPassword) {
        ctx.addIssue({
          code: 'custom',
          message: 'Missing current password',
          input: val.currentPassword,
        });
      }
    }) satisfies ZodType<ProfileUpdateData>,
});

export default { update };
