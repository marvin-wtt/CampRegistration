import type { Event } from '@camp-registration/common/entities';
import type { PageMeta } from '#utils/pageMeta';
import { translateObject } from '#utils/translateObject';
import { generateUrl } from '#utils/url';
import config from '#config/index';

const text = (value: unknown): string =>
  typeof value === 'string' ? value : '';

/**
 * The link preview for an event's public program page. Depends only on the
 * event and the `program-public` setting's `enabled` flag — never on who is
 * asking — so it stays a pure, cacheable function of stored state, same as
 * `event.meta.ts`'s `buildEventPageMeta`.
 */
export function buildProgramPublicPageMeta(
  event: Event,
  enabled: boolean,
  locale: string,
): PageMeta {
  const language = locale.split('-')[0];
  const name = text(translateObject(event.name, locale));

  return {
    title: name,
    siteName: config.appName,
    description: enabled
      ? `See today's program for ${name}.`
      : `The program for ${name} has not been published yet.`,
    url: generateUrl(['events', event.id, 'program']),
    locale: language === locale ? language : locale.replace('-', '_'),
    image: event.logo ?? undefined,
  };
}
