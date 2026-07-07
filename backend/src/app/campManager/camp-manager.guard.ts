import { CampManagerService } from '#app/campManager/camp-manager.service';
import type { Request } from 'express';
import type { Permission } from '@camp-registration/common/permissions';
import { resolve } from '#core/ioc/container';
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
 * Allows a manager to act on their own camp-manager record (e.g. leaving the
 * camp) regardless of permission — the invariant checks in the controller
 * still block removing the sole director.
 */
export const campManagerSelf = (req: Request): boolean => {
  const manager = req.modelOrFail('campManager');
  const userId = req.authUserId();

  return manager.userId === userId;
};

/**
 * Resolves the realtime-stream subscriber for the route's camp: the requesting
 * user's own manager record id, current permission set, and expiry. Returns
 * `null` when the user is not (or no longer) a non-expired manager, ending the
 * stream. Shares its authorization logic with `campManager()` above via
 * {@link CampManagerService.getManagerAuthorization}.
 */
export const campManagerSubscriber: SubscriberResolver = async (req) => {
  const userId = req.authUserId();
  const campId = req.modelOrFail('camp').id;
  const managerService = resolve(CampManagerService);

  const authorization = await managerService.getManagerAuthorization(
    campId,
    userId,
  );
  if (authorization === null) {
    return null;
  }

  return {
    managerId: authorization.managerId,
    permissions: new Set(authorization.permissions),
    expiresAt: authorization.expiresAt,
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
