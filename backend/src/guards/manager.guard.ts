import { CampManagerService } from '#app/campManager/camp-manager.service.js';
import type { Request } from 'express';
import type { Permission } from '@camp-registration/common/permissions';
import { permissionRegistry } from '#core/permission-registry';
import { resolve } from '#core/ioc/container';

export const campManager = (
  permission: Permission,
): ((req: Request) => Promise<boolean | string>) => {
  return async (req: Request) => {
    const userId = req.authUserId();
    const campId = req.modelOrFail('camp').id;

    const managerService = resolve(CampManagerService);
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

export const campPublic = (req: Request): boolean => {
  return req.modelOrFail('camp').public;
};

export const registrationOpen = (req: Request): boolean => {
  const camp = req.modelOrFail('camp');
  const now = new Date();
  if (camp.registrationOpenAt && now < camp.registrationOpenAt) {
    return false;
  }
  if (camp.registrationCloseAt && now > camp.registrationCloseAt) {
    return false;
  }
  return true;
};
