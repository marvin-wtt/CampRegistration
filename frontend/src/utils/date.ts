// Parse a plain `YYYY-MM-DD` value into a Date at local midnight. Using
// `new Date('YYYY-MM-DD')` would parse as UTC midnight and drift to the
// previous day for users in negative-UTC timezones, so build it explicitly.
export function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

export function daysBetweenDates(start: Date, end: Date): number {
  const utcStart = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );

  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

  return Math.round((utcEnd - utcStart) / (1000 * 60 * 60 * 24));
}

export function isValidTimeRange(startTime: string, endTime: string): boolean {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);

  return start !== null && end !== null && start < end;
}

export function timeDifference(startTime: string, endTime: string): number {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);

  if (start === null || end === null) {
    return 0;
  }

  return end - start;
}

export function parseTimeToMinutes(time: string): number | null {
  const parts = time.split(':');

  if (parts.length !== 2) {
    return null;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}
