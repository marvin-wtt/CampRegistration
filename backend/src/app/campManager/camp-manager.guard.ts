import { CampManagerService } from '#app/campManager/camp-manager.service';
import type { Request } from 'express';
import type { Permission } from '@camp-registration/common/permissions';
import { resolve } from '#core/ioc/container';

export const campManager = (
  permission: Permission,
): ((req: Request) => Promise<boolean | string>) => {
  return async (req: Request) => {
    const userId = req.authUserId();
    const campId = req.modelOrFail('camp').id;
    const managerService = resolve(CampManagerService);

    return managerService.campManagerHasPermission(campId, userId, permission);
  };
};

export const campPublic = (req: Request): boolean => {
  return req.modelOrFail('camp').public;
};

export const registrationOpen = (req: Request): boolean => {
  const camp = req.modelOrFail('camp');
  const { registrationOpensAt, registrationClosesAt } = camp;

  if (!registrationOpensAt && !registrationClosesAt) {
    return false;
  }

  const now = new Date();
  if (registrationOpensAt && now < registrationOpensAt) {
    return false;
  }

  return !(registrationClosesAt && now > registrationClosesAt);
};
