import { createRouter } from '#core/router/router';
import type { AppRouter } from '#core/base/AppModule';
import { resolve } from '#core/ioc/container';
import { EventService } from '#app/event/event.service';
import { renderSitemap } from '#core/seo/sitemap';
import { generateUrl } from '#utils/url';

// A block-list, not "Disallow: /" plus exceptions: crawlers must still fetch
// the SPA's scripts and styles to render the public pages.
// Every top-level route of `frontend/src/router/routes.ts` except `/`.
const DISALLOWED_PATHS = [
  '/setup',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/verify-otp',
  '/management',
  '/administration',
  '/settings',
  '/newsletters',
  '/print',
] as const;

/**
 * Served here rather than as static files, because both must name the
 * deployment's own origin. Like the link previews, neither depends on who is
 * asking, so both are cached publicly.
 */
export function createSeoRouter(): AppRouter {
  const router = createRouter();

  router.get('/robots.txt', (_req, res) => {
    const body = [
      'User-agent: *',
      ...DISALLOWED_PATHS.map((path) => `Disallow: ${path}`),
      '',
      `Sitemap: ${generateUrl('sitemap.xml')}`,
    ];

    res
      .type('text/plain')
      .set('Cache-Control', 'public, max-age=86400')
      .send(`${body.join('\n')}\n`);
  });

  router.get('/sitemap.xml', async (_req, res) => {
    const events = await resolve(EventService).getSitemapEvents();

    const xml = renderSitemap([
      { url: generateUrl('') },
      { url: generateUrl('events') },
      ...events.map((event) => ({
        url: generateUrl(['events', event.id]),
        lastModified: event.updatedAt,
      })),
    ]);

    res
      .type('application/xml')
      .set('Cache-Control', 'public, max-age=3600')
      .send(xml);
  });

  return router;
}
