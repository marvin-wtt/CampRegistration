import { z } from 'zod';
import { PasswordSchema } from '#core/validation/helper';

const update = z.object({
  body: z
    .object({
      email: z.string().email(),
      password: PasswordSchema,
      name: z.string(),
      locale: z.string().regex(/^[a-z]{2}(?:[_-][A-Z]{2})?$/),
    })
    .strict()
    .partial(),
});

export default { update };
