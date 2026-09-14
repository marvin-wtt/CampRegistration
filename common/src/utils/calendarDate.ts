/** The current calendar date (`YYYY-MM-DD`) as observed in `timeZone`. */
export function currentDateInTimeZone(timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter
    .formatToParts(new Date())
    .reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
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
