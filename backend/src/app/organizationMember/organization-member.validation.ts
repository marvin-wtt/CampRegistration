import { z, type ZodType } from 'zod';
import type {
  OrganizationMemberCreateData,
  OrganizationMemberUpdateData,
} from '@camp-registration/common/entities';

const index = z.object({
  params: z.object({
    organizationId: z.ulid(),
  }),
});

const store = z.object({
  params: z.object({
    organizationId: z.ulid(),
  }),
  body: z.object({
    email: z.email().max(255),
    role: z.enum(['ADMIN', 'MEMBER']),
  }) satisfies ZodType<OrganizationMemberCreateData>,
});

const update = z.object({
  params: z.object({
    organizationId: z.ulid(),
    organizationMemberId: z.ulid(),
  }),
  body: z.object({
    role: z.enum(['ADMIN', 'MEMBER']),
  }) satisfies ZodType<OrganizationMemberUpdateData>,
});

const destroy = z.object({
  params: z.object({
    organizationId: z.ulid(),
    organizationMemberId: z.ulid(),
  }),
});

export default {
  index,
  store,
  update,
  destroy,
};
