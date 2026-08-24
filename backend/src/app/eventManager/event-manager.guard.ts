import { EventManagerService } from '#app/eventManager/event-manager.service';
import type { Request } from 'express';
import { resolve } from '#core/ioc/container';
import { admin } from '#core/guard';
import type { SubscriberResolver } from '#app/realtime/realtime.stream';

/**
 * Allows a manager to act on their own event-manager record (e.g. leaving the
 * event) regardless of permission — the invariant checks in the controller
 * still block removing the sole director.
 */
export const eventManagerSelf = (req: Request): boolean => {
  const manager = req.modelOrFail('eventManager');
  const userId = req.authUserId();

  return manager.userId === userId;
};

/**
 * Resolves the realtime-stream subscriber for the route's event: the requesting
 * user's own manager record id, current permission set, and expiry. Returns
 * `null` when the user is not (or no longer) a non-expired manager, ending the
 * stream. Shares its authorization logic with the `event` scope resolver in
 * `event.guard.ts` via {@link EventManagerService.getManagerAuthorization}.
 *
 * System administrators are not event managers and so have no manager record,
 * but the connect guard admits them via its `admin` bypass — mirror that here
 * by resolving them through {@link EventManagerService.getAdminAuthorization}.
 */
export const eventManagerSubscriber: SubscriberResolver = async (req) => {
  const managerService = resolve(EventManagerService);

  if (admin(req)) {
    return managerService.getAdminAuthorization();
  }

  const userId = req.authUserId();
  const eventId = req.modelOrFail('event').id;

  return await managerService.getManagerAuthorization(eventId, userId);
};
