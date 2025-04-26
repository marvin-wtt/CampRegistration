import managerService from '#app/manager/manager.service';
import type { Request } from 'express';
import type { Permission } from '@camp-registration/common/permissions';

export const campManager = (
  permission: Permission,
): ((req: Request) => Promise<boolean | string>) => {
  return async (req: Request) => {
    const userId = req.authUserId();
    const campId = req.modelOrFail('camp').id;

    const manager = await managerService.getManagerByUserId(campId, userId);

    // TODO Load permissions for role
    const permissions: Permission[] = [];

    if (!permissions.includes(permission)) {
      return false;
    }

    if (manager === null) {
      return false;
    }

    return manager.expiresAt === null || manager.expiresAt > new Date();
  };
};

export const campActive = (req: Request): boolean | string => {
  return req.modelOrFail('camp').active;
};
