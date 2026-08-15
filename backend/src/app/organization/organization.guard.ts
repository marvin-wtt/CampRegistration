import type { Request } from 'express';
import type { OrganizationPermission } from '@camp-registration/common/permissions';
import { resolve } from '#core/ioc/container';
import { OrganizationMemberService } from '#app/organizationMember/organization-member.service';

export const organizationMember = (
  permission: OrganizationPermission,
): ((req: Request) => Promise<boolean>) => {
  return async (req: Request) => {
    const userId = req.authUserId();
    const organizationId = req.modelOrFail('organization').id;

    return resolve(OrganizationMemberService).hasPermission(
      organizationId,
      userId,
      permission,
    );
  };
};

/**
 * Allows a member to act on their own membership row (leaving the
 * organization) regardless of permission. The last-admin check in the
 * controller still blocks removing the final administrator.
 */
export const organizationMemberSelf = (req: Request): boolean => {
  const member = req.modelOrFail('organizationMember');

  return member.userId === req.authUserId();
};
