import { CampManagerService } from '#app/campManager/camp-manager.service.js';
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
  const now = new Date();
  if (camp.registrationOpenAt && now < camp.registrationOpenAt) {
    return false;
  }
  if (camp.registrationCloseAt && now > camp.registrationCloseAt) {
    return false;
  }
  return true;
};
