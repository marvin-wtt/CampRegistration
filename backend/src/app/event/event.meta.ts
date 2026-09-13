import type { Event } from '@camp-registration/common/entities';
import type { PageMeta } from '#utils/pageMeta';
import { translateObject } from '#utils/translateObject';
import { generateUrl } from '#utils/url';
import config from '#config/index';
import { naiveDateTimeToUtcCarrier } from '@camp-registration/common/utils';

/** Translatable fields are JSON columns — not guaranteed to hold a string. */
const text = (value: unknown): string =>
  typeof value === 'string' ? value : '';

/**
 * Rendered server-side, with no viewer whose own offset could cancel out a
 * conversion — so this reads `startAt`/`endAt` via the UTC-carrier and formats
 * with an explicit `timeZone: 'UTC'`, reproducing the organizer's literal
 * digits regardless of the server's own configured timezone.
 */
function formatDateRange(
  startAt: string,
  endAt: string,
  locale: string,
): string {
  const start = naiveDateTimeToUtcCarrier(startAt);
  const end = naiveDateTimeToUtcCarrier(endAt);

  const format = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  });

  return start.getTime() === end.getTime()
    ? format.format(start)
    : format.formatRange(start, end);
}

/**
 * The link preview for one event.
 *
 * Takes the *common* `Event` entity — the same projection the JSON API returns
 * — rather than the Prisma row, so a column the API does not expose (`form`,
 * `themes`, …) is a type error here rather than a leak into a crawler's card.
 * Whitespace and length are the renderer's job; this only chooses the values.
 */
export function buildEventPageMeta(event: Event, locale: string): PageMeta {
  // A canonical tag, as `req.preferredLocale()` guarantees — `Intl` throws on
  // anything else.
  const language = locale.split('-')[0];

  const organizer = text(translateObject(event.organizer, locale));
  const location =
    event.location === null
      ? ''
      : text(translateObject(event.location, locale));

  // Composed from data only — no translated words — so the description needs no
  // locale files of its own.
  const description = [
    formatDateRange(event.startAt, event.endAt, locale),
    location,
    organizer,
  ]
    .filter((part) => part.length > 0)
    .join(' · ');

  return {
    title: text(translateObject(event.name, locale)),
    siteName: config.appName,
    description,
    url: generateUrl(['events', event.id]),
    locale: language === locale ? language : locale.replace('-', '_'),
    image: event.logo ?? undefined,
  };
}
