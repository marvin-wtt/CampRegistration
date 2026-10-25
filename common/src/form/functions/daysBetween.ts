import { toCalendarDate } from './calendarDate.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const toEpochDay = (value: unknown): number | null => {
  const date = toCalendarDate(value);

  return date
    ? Date.UTC(date.year, date.month - 1, date.day) / MS_PER_DAY
    : null;
};

/**
 * `daysBetween(start, end, inclusive?)` — the number of calendar days from
 * `start` to `end`.
 *
 * Only the calendar date of each value counts; time of day, timezone and DST
 * are ignored. Accepts `YYYY-MM-DD` dates, naive datetimes such as
 * `{event.startAt}` / `{event.endAt}`, and `Date` objects.
 *
 * Counting:
 * - By default the start day is excluded and the end day is included, i.e. the
 *   number of nights: Monday → Friday is `4`, and the same day is `0`.
 * - With `inclusive` set to `true`, both the start and the end day are counted:
 *   Monday → Friday is `5`, and the same day is `1`.
 *
 * The result is negative when `end` lies before `start` (`inclusive` then
 * counts both days in the other direction: Friday → Monday is `-5`). Returns
 * `undefined` in expressions when a date is missing or invalid.
 *
 * @example daysBetween({event.startAt}, {event.endAt})
 * @example daysBetween({event.startAt}, {event.endAt}, true)
 */
const daysBetween = (params: unknown[]): number | null => {
  if (params.length < 2 || params.length > 3) {
    return null;
  }

  const start = toEpochDay(params[0]);
  const end = toEpochDay(params[1]);
  if (start === null || end === null) {
    return null;
  }

  const inclusive = params[2] ?? false;
  if (typeof inclusive !== 'boolean') {
    return null;
  }

  const days = end - start;
  if (!inclusive) {
    return days;
  }

  return days < 0 ? days - 1 : days + 1;
};

export default daysBetween;
