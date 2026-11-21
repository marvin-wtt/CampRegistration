import { EventManagerService } from '#app/eventManager/event-manager.service';
import type { Request } from 'express';
import { resolve } from '#core/ioc/container';
import { admin } from '#core/guard';
import { findActiveAdminAccess } from '#core/permission/admin-access';
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
 * A system administrator with an active access grant gets
 * {@link EventManagerService.getAdminAuthorization} until the grant expires,
 * re-checked on the heartbeat so ending it early closes the admin view too.
 * Without a grant, they resolve like any manager.
 */
export const eventManagerSubscriber: SubscriberResolver = async (req) => {
  const managerService = resolve(EventManagerService);
  const userId = req.authUserId();
  const eventId = req.modelOrFail('event').id;

  // Not cached per request: the stream re-resolves on the same request.
  const access = admin(req)
    ? await findActiveAdminAccess(userId, 'event', eventId)
    : null;
  if (access) {
    return {
      ...managerService.getAdminAuthorization(),
      expiresAt: access.expiresAt,
      revalidate: true,
    };
  }

  return await managerService.getManagerAuthorization(eventId, userId);
};
