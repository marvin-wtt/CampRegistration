import moment from 'moment';

/**
 * Every seeded date is relative to the moment the seeder runs, so the flagship
 * event is still upcoming and its registration still open however long after the
 * seed the database is used.
 */
const anchor = moment().startOf('day');

/** `days` from the day the seed ran, at `HH:mm` local time. */
export function seedDate(days: number, time = '12:00'): Date {
  const [hours, minutes] = time.split(':').map(Number);

  return anchor
    .clone()
    .add(days, 'days')
    .set({ hour: hours, minute: minutes, second: 0, millisecond: 0 })
    .toDate();
}

/** The `YYYY-MM-DD` string form, for the date-only columns (tasks, program). */
export function seedDay(days: number): string {
  return anchor.clone().add(days, 'days').format('YYYY-MM-DD');
}

/** Day offsets that put each event into a distinct lifecycle phase. */
export const PHASE = {
  /** Flagship: three months out, registration open. */
  upcoming: { start: 94, end: 101 },
  /** Started two days ago, ends in five. */
  ongoing: { start: -2, end: 5 },
  /** Ended twelve days ago — still listed under "recently ended". */
  recentlyEnded: { start: -19, end: -12 },
  /** Ended five months ago — beyond the six-week cutoff, so fully past. */
  past: { start: -157, end: -150 },
} as const;
