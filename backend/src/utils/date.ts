import { zonedInstant } from '@camp-registration/common/utils';

// Date-only values travel as `YYYY-MM-DD` and are stored as UTC midnight.

export function toDbDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Every `YYYY-MM-DD` date from `from` to `to`, inclusive. */
export function eachDate(from: string, to: string): string[] {
  const dates: string[] = [];
  const end = toDbDate(to);
  for (
    const date = toDbDate(from);
    date <= end;
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    dates.push(toDateString(date));
  }
  return dates;
}

// Calendar months travel as `YYYY-MM` and are read in an explicit time zone,
// so an instant just after midnight lands in the month it was there.

/** The `YYYY-MM` an instant falls in, in `timeZone`. */
export function monthOf(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
  })
    .format(date)
    .slice(0, 7);
}

/** The `YYYY-MM-DD` an instant falls on, in `timeZone`. */
export { calendarDateInTimeZone as dayOf } from '@camp-registration/common/utils';

/** `month` moved by `delta` months, e.g. `addMonths('2026-01', -1)` is `2025-12`. */
export function addMonths(month: string, delta: number): string {
  const [year = 0, monthNumber = 1] = month.split('-').map(Number);
  const index = year * 12 + (monthNumber - 1) + delta;
  const shiftedMonth = String((index % 12) + 1).padStart(2, '0');

  return `${Math.floor(index / 12).toString()}-${shiftedMonth}`;
}

/** Every `YYYY-MM` from `from` to `to`, inclusive. */
export function eachMonth(from: string, to: string): string[] {
  const months: string[] = [];
  for (let month = from; month <= to; month = addMonths(month, 1)) {
    months.push(month);
  }
  return months;
}

/** The instants `month` starts at and the next month starts at, in `timeZone`. */
export function monthRange(
  month: string,
  timeZone: string,
): { start: Date; end: Date } {
  return {
    start: zonedInstant(`${month}-01T00:00:00`, timeZone),
    end: zonedInstant(`${addMonths(month, 1)}-01T00:00:00`, timeZone),
  };
}
