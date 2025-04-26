import managerService from '#app/manager/manager.service';
import type { Request } from 'express';
import type { Permission } from '@camp-registration/common/permissions';
import { permissionRegistry } from '#core/permission-registry';

export const campManager = (
  permission: Permission,
): ((req: Request) => Promise<boolean | string>) => {
  return async (req: Request) => {
    const userId = req.authUserId();
    const campId = req.modelOrFail('camp').id;

    const manager = await managerService.getManagerByUserId(campId, userId);
    if (manager === null) {
      return false;
    }

    const permissions = permissionRegistry.getPermissions(manager.role);

    if (!permissions.includes(permission)) {
      return false;
    }

    return manager.expiresAt === null || manager.expiresAt > new Date();
  };
};

export const campActive = (req: Request): boolean | string => {
  return req.modelOrFail('camp').active;
};
