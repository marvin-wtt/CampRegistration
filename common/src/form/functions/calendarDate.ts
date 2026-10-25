export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

const DATE_PREFIX_REGEX = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * The calendar date of `value`, or `null` if it is not a date. Strings are read
 * by their leading `YYYY-MM-DD` digits as written — any time or offset after
 * them is ignored, so a naive event datetime like `{event.startAt}` keeps its
 * own calendar day. `Date`s are read through their local getters.
 */
export function toCalendarDate(value: unknown): CalendarDate | null {
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

  return { year, month, day };
}
