import type { Event } from '@camp-registration/common/entities';
import type { PageMeta } from '#utils/pageMeta';
import { translateObject } from '#utils/translateObject';
import { generateUrl } from '#utils/url';
import config from '#config/index';

/** Translatable fields are JSON columns — not guaranteed to hold a string. */
const text = (value: unknown): string =>
  typeof value === 'string' ? value : '';

/**
 * Formatted without an explicit timezone, matching what the page itself does
 * (`EventCard.vue`) — the runtime's zone, which for the server is the
 * container's (UTC) and for a browser is the viewer's.
 *
 * Neither is reliably the day the organizer typed: they enter a local time that
 * the browser converts to an instant (`TimeInput.timeToIso`), and no timezone
 * is stored alongside the event, so an event starting just after local midnight
 * can render as the day before. Deliberately left as-is here so the preview and
 * the page agree; fixing it properly means storing the event's timezone.
 */
function formatDateRange(
  startAt: string,
  endAt: string,
  locale: string,
): string {
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return '';
  }

  const format = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
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
