import { z } from 'zod';
import { EmailSchema, PasswordSchema } from '#core/validation/helper';

const setup = z.object({
  body: z.object({
    name: z.string().min(1),
    email: EmailSchema,
    password: PasswordSchema,
  }),
});

export default {
  setup,
};
