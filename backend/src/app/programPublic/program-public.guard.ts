import { RESOURCE_VIEW_PERMISSION } from '@camp-registration/common/realtime';
import { admin } from '#core/guard';
import { resolve } from '#core/ioc/container';
import { EventService } from '#app/event/event.service';
import { eventPubliclyVisible } from '#app/event/event.guard';
import type { SubscriberResolver } from '#app/realtime/realtime.stream';

export { eventPubliclyVisible as programPublicViewGuard };

// Tied to the shared resource->permission map rather than hand-typed, so a
// rename there cannot silently desync this subscriber's permission set.
const PROGRAM_PUBLIC_PERMISSIONS = new Set([
  RESOURCE_VIEW_PERMISSION.program_item,
  RESOURCE_VIEW_PERMISSION.setting,
]);

/**
 * Realtime-stream subscriber for the anonymous public program stream. Gated
 * on organization verification only, not the `program-public.enabled` flag —
 * the stream carries no model data, so there's nothing to leak by keeping it
 * open while disabled (lets a viewer learn the instant a manager publishes).
 *
 * Mirrors `eventManagerSubscriber`'s `admin` bypass so an admin's stream
 * doesn't 403 when the REST endpoints already let them through. Verification
 * is re-checked via a live query rather than the request's bound `event`
 * model, which is fetched once at connect and never refetched — reading it
 * again on each `revalidate` heartbeat would just repeat the same answer.
 */
export const programPublicSubscriber: SubscriberResolver = async (req) => {
  const eventId = req.modelOrFail('event').id;

  if (admin(req)) {
    return {
      managerId: '',
      permissions: PROGRAM_PUBLIC_PERMISSIONS,
      expiresAt: null,
    };
  }

  const eventService = resolve(EventService);
  const verified = await eventService.isOrganizationVerified(eventId);

  if (!verified) {
    return null;
  }

  return {
    managerId: '',
    permissions: PROGRAM_PUBLIC_PERMISSIONS,
    expiresAt: null,
    revalidate: true,
  };
};
