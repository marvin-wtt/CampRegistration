import type { Request } from 'express';
import { NewsletterManagerService } from '#app/newsletterManager/newsletter-manager.service.js';
import type { ScopePermission } from '@camp-registration/common/permissions';
import { resolve } from '#core/ioc/container';
import type { GuardFn } from '#core/guard';
import { scoped, type ScopeResolver } from '#core/permission.guard';

export const newsletterScopeResolver: ScopeResolver<'newsletter'> = {
  model: 'newsletter',
  async resolve(newsletterId, userId) {
    return resolve(NewsletterManagerService).getManagerPermissions(
      newsletterId,
      userId,
    );
  },
};

export const newsletterManager = (
  permission: ScopePermission<'newsletter'>,
): GuardFn => scoped('newsletter', permission);

/**
 * An unverified organization may set a newsletter up but not send from it —
 * unvetted mail reaching third parties is what verification exists to hold
 * back. A state rule, not a permission, so it composes with `and`.
 */
export const newsletterOrganizationVerified = (req: Request): boolean => {
  return (
    req.modelOrFail('newsletter').organization.verificationStatus === 'VERIFIED'
  );
};
