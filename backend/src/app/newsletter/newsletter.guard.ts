import { NewsletterManagerService } from '#app/newsletterManager/newsletter-manager.service.js';
import type { ScopePermission } from '@camp-registration/common/permissions';
import { resolve } from '#core/ioc/container';
import type { GuardFn } from '#core/guard';
import {
  registerScopeResolver,
  scoped,
  type ScopeResolver,
} from '#core/permission.guard';

export const newsletterScopeResolver: ScopeResolver<'newsletter'> = {
  model: 'newsletter',
  async resolve(newsletterId, userId) {
    return resolve(NewsletterManagerService).getManagerPermissions(
      newsletterId,
      userId,
    );
  },
};

export function registerNewsletterScopeResolver(): void {
  registerScopeResolver('newsletter', newsletterScopeResolver);
}

export const newsletterManager = (
  permission: ScopePermission<'newsletter'>,
): GuardFn => scoped('newsletter', permission);
