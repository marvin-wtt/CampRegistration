import type { Request } from 'express';
import type { ScopePermission } from '@camp-registration/common/permissions';
import { resolve } from '#core/ioc/container';
import type { GuardFn } from '#core/guard';
import { scoped, type ScopeResolver } from '#core/permission.guard';
import { OrganizationMemberService } from '#app/organizationMember/organization-member.service';

export const organizationScopeResolver: ScopeResolver<'organization'> = {
  model: 'organization',
  async resolve(organizationId, userId) {
    return resolve(OrganizationMemberService).getMemberPermissions(
      organizationId,
      userId,
    );
  },
};

export const organizationMember = (
  permission: ScopePermission<'organization'>,
): GuardFn => scoped('organization', permission);

/**
 * Allows a member to act on their own membership row (leaving the
 * organization) regardless of permission. The last-admin check in the
 * controller still blocks removing the final administrator.
 */
export const organizationMemberSelf = (req: Request): boolean => {
  const member = req.modelOrFail('organizationMember');

  return member.userId === req.authUserId();
};
