import { z, type ZodType } from 'zod';
import { LocaleSchema, PasswordSchema } from '#core/validation/helper';
import type {
  UserCreateData,
  UserUpdateData,
  UserQuery,
} from '@camp-registration/common/entities';

const RoleSchema = z.enum(['USER', 'ADMIN']);

const show = z.object({
  params: z.object({
    userId: z.ulid(),
  }),
});

const UserSortBySchema = z.enum([
  'name',
  'email',
  'role',
  'lastSeen',
  'createdAt',
  'emailVerified',
  'locked',
]);

const index = z.object({
  query: z
    .object({
      search: z.string(),
      name: z.string(),
      email: z.string(),
      role: RoleSchema,
      status: z.enum(['active', 'locked', 'unverified']),
      sortBy: UserSortBySchema,
      sortType: z.enum(['asc', 'desc']),
      limit: z.coerce.number().int().positive().max(100),
      cursor: z.ulid(),
    })
    .partial() satisfies ZodType<UserQuery>,
});

const store = z.object({
  body: z.object({
    email: z.email(),
    password: PasswordSchema,
    name: z.string(),
    role: RoleSchema.optional(),
    locale: LocaleSchema.optional(),
    locked: z.boolean().optional(),
  }) satisfies ZodType<UserCreateData>,
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
    .partial() satisfies ZodType<UserUpdateData>,
});

const destroy = z.object({
  params: z.object({
    userId: z.ulid(),
  }),
});

const resetTwoFactor = z.object({
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
  resetTwoFactor,
};
