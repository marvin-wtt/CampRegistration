export function daysBetweenDates(start: Date, end: Date): number {
  const utcStart = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );

  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

  return Math.round((utcEnd - utcStart) / (1000 * 60 * 60 * 24));
}
