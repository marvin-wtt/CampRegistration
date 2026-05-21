import { NewsletterManagerService } from '#app/newsletterManager/newsletter-manager.service.js';
import type { Request } from 'express';
import type { NewsletterPermission } from '@camp-registration/common/permissions';
import { newsletterPermissionRegistry } from '#core/permission-registry';
import { resolve } from '#core/ioc/container';

export const newsletterManager = (
  permission: NewsletterPermission,
): ((req: Request) => Promise<boolean>) => {
  return async (req: Request) => {
    const userId = req.authUserId();
    const newsletterId = req.modelOrFail('newsletter').id;

    const managerService = resolve(NewsletterManagerService);
    const manager = await managerService.getManagerByUserId(
      newsletterId,
      userId,
    );
    if (manager === null) {
      return false;
    }

    const permissions = newsletterPermissionRegistry.getPermissions(
      manager.role,
    );
    return permissions.includes(permission);
  };
};
