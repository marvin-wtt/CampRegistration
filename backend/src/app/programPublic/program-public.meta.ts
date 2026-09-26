import type { Event } from '@camp-registration/common/entities';
import type { PageMeta } from '#utils/pageMeta';
import { translateObject } from '#utils/translateObject';
import { generateUrl } from '#utils/url';
import i18n from '#core/i18n/i18n.client';
import config from '#config/index';

const text = (value: unknown): string =>
  typeof value === 'string' ? value : '';

/**
 * The link preview for an event's public program page. A pure function of
 * the event alone — never the `program-public.enabled` setting or the
 * current date — because the platform a link is shared on caches this,
 * sometimes for days: a description that claimed "published" or "today's
 * program" would go stale the moment either changed underneath it.
 */
export function buildProgramPublicPageMeta(
  event: Event,
  locale: string,
): PageMeta {
  const language = locale.split('-')[0];
  const name = text(translateObject(event.name, locale));
  const t = i18n.getFixedT(locale, 'programPublic', 'meta');

  return {
    title: name,
    siteName: config.appName,
    description: t('description', { name }),
    url: generateUrl(['events', event.id, 'program']),
    locale: language === locale ? language : locale.replace('-', '_'),
    image: event.logo ?? undefined,
  };
}
