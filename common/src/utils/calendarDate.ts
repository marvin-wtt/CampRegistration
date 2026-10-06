/** The calendar date (`YYYY-MM-DD`) an instant falls on in `timeZone`. */
export function calendarDateInTimeZone(date: Date, timeZone: string): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** The current calendar date (`YYYY-MM-DD`) as observed in `timeZone`. */
export function currentDateInTimeZone(timeZone: string): string {
  return calendarDateInTimeZone(new Date(), timeZone);
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
