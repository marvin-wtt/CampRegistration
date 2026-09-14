import { currentDateInTimeZone } from '@camp-registration/common/utils';

/**
 * The day a public program viewer lands on when opening the link with no day
 * of their own chosen yet: today (in the event's own timezone) if it falls
 * within the event's dates, otherwise the event's first day — deliberately
 * not the last day when the event is already over, since the first day is
 * the more useful starting point for browsing its program afterwards.
 *
 * This is a policy specific to the public program link, not a generic date
 * utility, so it lives with the feature rather than in `common/` — only
 * `currentDateInTimeZone` (the actual reusable primitive) is shared.
 */
export function computeDefaultPublicDate(event: {
  startAt: string;
  endAt: string;
  timezone: string;
}): string {
  // `startAt`/`endAt` are naive local datetimes (`YYYY-MM-DDTHH:mm:ss`), local
  // to `event.timezone` — their date part needs no timezone conversion.
  const startDate = event.startAt.slice(0, 10);
  const endDate = event.endAt.slice(0, 10);
  const today = currentDateInTimeZone(event.timezone);

  return today >= startDate && today <= endDate ? today : startDate;
}
