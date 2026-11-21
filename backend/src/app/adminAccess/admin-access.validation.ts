import { z, type ZodType } from 'zod';
import type {
  AdminAccessGrantCreateData,
  AdminAccessGrantQuery,
} from '@camp-registration/common/entities';
import { PERMISSION_SCOPES } from '@camp-registration/common/permissions';

const index = z.object({
  query: z
    .object({
      scope: z.enum(PERMISSION_SCOPES),
      userId: z.ulid(),
      active: z.stringbool(),
      search: z.string().trim().min(1),
      limit: z.coerce.number().int().positive().max(100),
      cursor: z.ulid(),
    })
    .partial() satisfies ZodType<AdminAccessGrantQuery>,
});

const store = z.object({
  body: z.object({
    scope: z.enum(PERMISSION_SCOPES),
    scopeId: z.ulid(),
    reason: z.string().trim().min(3).max(500),
  }) satisfies ZodType<AdminAccessGrantCreateData>,
});

const destroy = z.object({
  params: z.object({
    grantId: z.ulid(),
  }),
});

export default { index, store, destroy };
