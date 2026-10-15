const MS_PER_DAY = 1000 * 60 * 60 * 24;

const DATE_PREFIX_REGEX = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Days since the epoch for the calendar date of `value`, or `null` if it is not
 * a date. Strings are read by their leading `YYYY-MM-DD` digits as written —
 * any time or offset after them is ignored, so a naive event datetime like
 * `{event.startAt}` keeps its own calendar day. `Date`s are read through their
 * local getters, matching `htmlDate`.
 */
const toEpochDay = (value: unknown): number | null => {
  let year: number;
  let month: number;
  let day: number;

  if (typeof value === 'string') {
    const match = DATE_PREFIX_REGEX.exec(value);
    if (!match) {
      return null;
    }
    [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else if (value instanceof Date && !isNaN(value.getTime())) {
    [year, month, day] = [
      value.getFullYear(),
      value.getMonth() + 1,
      value.getDate(),
    ];
  } else {
    return null;
  }

  const utc = new Date(Date.UTC(year, month - 1, day));
  // Reject digits that roll over into another date, e.g. `2025-02-30`
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return null;
  }

  return utc.getTime() / MS_PER_DAY;
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
