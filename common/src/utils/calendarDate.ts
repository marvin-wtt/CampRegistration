import { zonedNaiveDateTime } from './naiveDateTime.js';

/** The calendar date (`YYYY-MM-DD`) `instant` falls on in `timeZone`. */
export function dateInTimeZone(instant: Date, timeZone: string): string {
  return zonedNaiveDateTime(instant, timeZone).slice(0, 10);
}

/** The calendar date (`YYYY-MM-DD`) `now` falls on in `timeZone`. */
export function currentDateInTimeZone(
  timeZone: string,
  now = new Date(),
): string {
  return dateInTimeZone(now, timeZone);
}

/**
 * A `YYYY-MM-DD` date moved by whole months, then days. A month ending
 * earlier clamps to its last day: 31 January + 1 month is 28 February.
 */
export function addToDate(
  date: string,
  { months = 0, days = 0 }: { months?: number; days?: number },
): string {
  const [year = 1970, month = 1, day = 1] = date.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay) + days);

  return target.toISOString().slice(0, 10);
}

/** Whole days from one `YYYY-MM-DD` date to another; negative if earlier. */
export function daysBetween(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);

  return Math.round(ms / 86_400_000);
}

/** `YYYY-MM-DD` strings from `date + from` to `date + to` days, inclusive. */
export function dateRange(date: string, from: number, to: number): string[] {
  const base = new Date(`${date}T00:00:00Z`);
  const dates: string[] = [];

  for (let offset = from; offset <= to; offset++) {
    const day = new Date(base);
    day.setUTCDate(base.getUTCDate() + offset);
    dates.push(day.toISOString().slice(0, 10));
  }

  return dates;
}

/** Clamps a plain `YYYY-MM-DD` date to the inclusive `[min, max]` range. */
export function clampDate(date: string, min: string, max: string): string {
  if (date < min) {
    return min;
  }
  if (date > max) {
    return max;
  }
  return date;
}
