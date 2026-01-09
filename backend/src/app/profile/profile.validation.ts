import { z } from 'zod';
import { LocaleSchema, PasswordSchema } from '#core/validation/helper';

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
    .check((ctx) => {
      const val = ctx.value;
      const passwordRequired = val.password ?? val.email;
      if (passwordRequired && !val.currentPassword) {
        ctx.issues.push({
          code: 'custom',
          message: 'Missing current password',
          input: val.currentPassword,
        });
      }
    }),
});

export default { update };
