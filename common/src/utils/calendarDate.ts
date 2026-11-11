import { zonedNaiveDateTime } from './naiveDateTime.js';

/** The calendar date (`YYYY-MM-DD`) `now` falls on in `timeZone`. */
export function currentDateInTimeZone(
  timeZone: string,
  now = new Date(),
): string {
  return zonedNaiveDateTime(now, timeZone).slice(0, 10);
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
