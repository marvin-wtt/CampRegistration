import { eventPubliclyVisible } from '#app/event/event.guard';
import type { SubscriberResolver } from '#app/realtime/realtime.stream';

export { eventPubliclyVisible as programPublicViewGuard };

/**
 * Resolves the realtime-stream subscriber for the anonymous public program
 * stream. Gated on {@link eventPubliclyVisible} only — the same anonymous rule
 * as the event page and its link preview — and deliberately NOT on the
 * `program-public` setting's `enabled` flag: the stream carries no model data
 * (see `docs/live-updates-plan.md`), only `{resource,id,op}` invalidation
 * signals, so there is nothing to leak by keeping it open while disabled. That
 * lets a viewer looking at the "not published yet" state learn the instant a
 * manager turns the link on, instead of needing to refresh manually. The
 * `enabled` check belongs solely on the data endpoint
 * (`ProgramPublicService.getPublicView`), which is the only place that can
 * actually expose the schedule.
 *
 * `revalidate: true` because organization-verification can be revoked with no
 * realtime event to react to (mirrors the same reasoning documented on
 * `RealtimeSubscriber.revalidate` for organization-derived permissions
 * elsewhere) — without it, a stream opened while the org was verified would
 * stay open indefinitely after verification is revoked.
 */
export const programPublicSubscriber: SubscriberResolver = async (req) => {
  const visible = await eventPubliclyVisible(req);

  if (visible !== true) {
    return null;
  }

  return {
    managerId: '',
    permissions: new Set(['event.program_items.view', 'event.view']),
    expiresAt: null,
    revalidate: true,
  };
};
