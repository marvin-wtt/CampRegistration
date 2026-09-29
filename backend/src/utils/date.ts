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
