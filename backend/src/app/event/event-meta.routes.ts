import { createRouter } from '#core/router/router';
import type { AppRouter } from '#core/base/AppModule';
import { metaRoute } from '#core/meta/metaRoute';
import { eventPubliclyVisible } from '#app/event/event.guard';
import { EventResource } from '#app/event/event.resource';
import { buildEventPageMeta } from '#app/event/event.meta';

/**
 * The link preview for an event page.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ PERMISSIONS — READ BEFORE CHANGING EITHER SIDE                           │
 * │                                                                          │
 * │ This route publishes event data to unauthenticated clients, exactly as   │
 * │ `GET /api/v1/events/:eventId` does. The two MUST stay in agreement:      │
 * │                                                                          │
 * │  • Visibility comes from `eventPubliclyVisible`, which is also the       │
 * │    anonymous half of the API route's `eventViewGuard`. Narrow the        │
 * │    anonymous rule there and both routes narrow together. Do not inline   │
 * │    a condition here.                                                     │
 * │  • The response must NOT depend on who is asking — that is why the       │
 * │    permission branch and the `guard()` wrapper (which ORs in `admin`)    │
 * │    are deliberately absent. A crawler never authenticates, and a logged- │
 * │    in viewer must receive the same bytes, or a shared cache can hand     │
 * │    privileged output to the next visitor.                               │
 * │  • Data comes from `EventResource`, the same projection the API returns. │
 * │                                                                          │
 * │ `tests/integration/app/event-meta.test.ts` fails if these drift apart.   │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Expects the request extensions its mount context installs (`#routes/web`).
 */
export function createEventMetaRouter(indexPath?: string): AppRouter {
  const router = createRouter();

  router.get(
    '/:eventId',
    metaRoute(async (req) => {
      // A link to an event that does not exist is ordinary — every unknown
      // path serves the shell — so it is a decline, not a 404.
      const event = req.model('event');
      if (event === undefined) {
        return null;
      }

      if ((await eventPubliclyVisible(req)) !== true) {
        return null;
      }

      return buildEventPageMeta(
        new EventResource(event).transform(),
        req.preferredLocale(),
      );
    }, indexPath),
  );

  return router;
}
