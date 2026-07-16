import { CampManagerService } from '#app/campManager/camp-manager.service';
import type { Request } from 'express';
import type { Permission } from '@camp-registration/common/permissions';
import { resolve } from '#core/ioc/container';
import { admin } from '#core/guard';
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
 *
 * System administrators are not camp managers and so have no manager record,
 * but the connect guard admits them via its `admin` bypass — mirror that here
 * by granting them every resource view permission (so `shouldDeliver` passes
 * for all events), a never-expiring snapshot, and an empty `managerId` (no
 * `manager` event can target them, so their permissions never need refreshing).
 */
export const campManagerSubscriber: SubscriberResolver = async (req) => {
  const managerService = resolve(CampManagerService);

  if (admin(req)) {
    return managerService.getAdminAuthorization();
  }

  const userId = req.authUserId();
  const campId = req.modelOrFail('camp').id;

  return managerService.getManagerAuthorization(campId, userId);
};
