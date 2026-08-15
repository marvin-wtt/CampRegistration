import { CampManagerService } from '#app/campManager/camp-manager.service';
import type { Request } from 'express';
import type { ScopePermission } from '@camp-registration/common/permissions';
import { resolve } from '#core/ioc/container';
import { admin, type GuardFn } from '#core/guard';
import { scoped, type ScopeResolver } from '#core/permission.guard';
import type { SubscriberResolver } from '#app/realtime/realtime.stream';

/**
 * Camp permissions resolve through {@link CampManagerService.getManagerAuthorization}
 * and nowhere else, so the REST guard, the realtime subscriber and
 * `profile.campAccess` cannot drift — see `docs/organizations.md`.
 */
export const campScopeResolver: ScopeResolver<'camp'> = {
  model: 'camp',
  async resolve(campId, userId) {
    const authorization = await resolve(
      CampManagerService,
    ).getManagerAuthorization(campId, userId);

    return authorization?.permissions ?? null;
  },
};

export const campManager = (permission: ScopePermission<'camp'>): GuardFn =>
  scoped('camp', permission);

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
 * by resolving them through {@link CampManagerService.getAdminAuthorization}.
 */
export const campManagerSubscriber: SubscriberResolver = async (req) => {
  const managerService = resolve(CampManagerService);

  if (admin(req)) {
    return managerService.getAdminAuthorization();
  }

  const userId = req.authUserId();
  const campId = req.modelOrFail('camp').id;

  return await managerService.getManagerAuthorization(campId, userId);
};
