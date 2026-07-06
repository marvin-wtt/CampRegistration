import { CampManagerService } from '#app/campManager/camp-manager.service';
import type { Request } from 'express';
import type { Permission } from '@camp-registration/common/permissions';
import { resolve } from '#core/ioc/container';
import { campPermissionRegistry } from '#core/permission-registry';
import type { SubscriberResolver } from '#app/realtime/realtime.stream';

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

/**
 * Resolves the realtime-stream subscriber for the route's camp: the requesting
 * user's current permission set and manager expiry. Returns `null` when the
 * user is not (or no longer) a non-expired manager, ending the stream.
 * Mirrors {@link CampManagerService.campManagerHasPermission}.
 */
export const campManagerSubscriber: SubscriberResolver = async (req) => {
  const userId = req.authUserId();
  const campId = req.modelOrFail('camp').id;
  const managerService = resolve(CampManagerService);

  const manager = await managerService.getManagerByUserId(campId, userId);
  if (manager === null) {
    return null;
  }
  if (manager.expiresAt !== null && manager.expiresAt <= new Date()) {
    return null;
  }

  return {
    permissions: new Set(campPermissionRegistry.getPermissions(manager.role)),
    expiresAt: manager.expiresAt,
  };
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
