import { z } from 'zod';
import { LocaleSchema, PasswordSchema } from '#core/validation/helper';

const update = z.object({
  body: z
    .object({
      email: z.string().email(),
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
        });
      }
    }),
});

export default { update };
