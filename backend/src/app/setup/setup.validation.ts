import { z } from 'zod';
import { PasswordSchema } from '#core/validation/helper';

const setup = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.email(),
    password: PasswordSchema,
  }),
});

export default {
  setup,
};
