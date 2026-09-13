import { createRouter } from '#core/router/router';
import type { AppRouter } from '#core/base/AppModule';
import { metaRoute } from '#core/meta/metaRoute';
import { resolve } from '#core/ioc/container';
import { eventPubliclyVisible } from '#app/event/event.guard';
import { SettingService } from '#app/setting/setting.service';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import type { ProgramPublicSettings } from '@camp-registration/common/settings';
import { EventResource } from '#app/event/event.resource';
import { buildProgramPublicPageMeta } from './program-public.meta.js';

/**
 * The link preview for an event's public program page.
 *
 * Mirrors `event-meta.routes.ts` exactly: visibility comes from
 * `eventPubliclyVisible` (never inlined here — narrow it there and both
 * routes narrow together), and the response must not depend on who is
 * asking, only on the event and the stored `program-public.enabled` flag —
 * both public facts already, safe to share across viewers/caches.
 */
export function createProgramPublicMetaRouter(indexPath?: string): AppRouter {
  const router = createRouter();

  router.get(
    '/:eventId/program',
    metaRoute(async (req) => {
      const event = req.model('event');
      if (event === undefined) {
        return null;
      }

      if ((await eventPubliclyVisible(req)) !== true) {
        return null;
      }

      const setting = await resolve(SettingService).getSetting(
        event.id,
        SETTING_KEYS.PROGRAM_PUBLIC,
      );
      const enabled =
        (setting?.data as ProgramPublicSettings | undefined)?.enabled ?? false;

      return buildProgramPublicPageMeta(
        new EventResource(event).transform(),
        enabled,
        req.preferredLocale(),
      );
    }, indexPath),
  );

  return router;
}
