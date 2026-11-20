import { z, type ZodType } from 'zod';
import type { AdminAccessGrantCreateData } from '@camp-registration/common/entities';
import { PERMISSION_SCOPES } from '@camp-registration/common/permissions';

const store = z.object({
  body: z.object({
    scope: z.enum(PERMISSION_SCOPES),
    scopeId: z.ulid(),
    reason: z.string().trim().min(3).max(500),
    // Either a 6-digit TOTP or a longer recovery code.
    otp: z.string().min(6),
  }) satisfies ZodType<AdminAccessGrantCreateData>,
});

const destroy = z.object({
  params: z.object({
    grantId: z.ulid(),
  }),
});

export default { store, destroy };
