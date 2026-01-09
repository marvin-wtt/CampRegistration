import { z } from 'zod';
import { LocaleSchema, PasswordSchema } from '#core/validation/helper';

const RoleSchema = z.enum(['USER', 'ADMIN']);

const show = z.object({
  params: z.object({
    userId: z.ulid(),
  }),
});

const index = z.object({
  query: z
    .object({
      name: z.string(),
      email: z.email(),
      role: z.string(),
      sortBy: z.string(),
      limit: z.number().int().positive(),
      page: z.number().int().positive(),
    })
    .partial(),
});

const store = z.object({
  body: z.object({
    email: z.email(),
    password: PasswordSchema,
    name: z.string(),
    role: RoleSchema.optional(),
    locale: LocaleSchema.optional(),
    locked: z.boolean().optional(),
  }),
});

const update = z.object({
  params: z.object({
    userId: z.ulid(),
  }),
  body: z
    .object({
      email: z.email(),
      password: PasswordSchema,
      name: z.string(),
      role: RoleSchema,
      locale: LocaleSchema.optional(),
      locked: z.boolean(),
      emailVerified: z.boolean(),
    })
    .partial(),
});

const destroy = z.object({
  params: z.object({
    userId: z.ulid(),
  }),
});

export default {
  show,
  index,
  store,
  update,
  destroy,
};
