export interface NaiveDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const NAIVE_DATETIME_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;

function pad(value: number, length = 2): string {
  return value.toString().padStart(length, '0');
}

export function formatNaiveDateTime(parts: NaiveDateTimeParts): string {
  const { year, month, day, hour, minute, second } = parts;

  return `${pad(year, 4)}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}`;
}

/**
 * Reads `date` through its **local** getters — "whatever a human just typed on
 * this screen" — and formats those digits as a naive datetime. This is the
 * only correct way to turn a picker's `Date` into the wire value: reaching for
 * `getMonth()`/`getDate()` by hand at each call site risks the classic
 * off-by-one on the zero-based month.
 */
export function localDateToNaiveDateTime(date: Date): string {
  return formatNaiveDateTime({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
  });
}

/**
 * Strict decompose of a naive (offset-less) ISO datetime string. Throws on a
 * `Z`/offset suffix — a naive value must never be silently reinterpreted as an
 * instant.
 */
export function parseNaiveDateTime(value: string): NaiveDateTimeParts {
  const match = NAIVE_DATETIME_REGEX.exec(value);

  if (!match) {
    throw new Error(`Not a naive (offset-less) datetime string: ${value}`);
  }

  const [, year, month, day, hour, minute, second] = match;

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
  };
}

/**
 * Turns naive digits into a `Date` used purely as an inert digit carrier for a
 * Prisma `DateTime` column (which has no offset of its own) — built via
 * `Date.UTC` so the result never depends on the runtime's own timezone. Never
 * compare the result against `new Date()` or treat it as a real instant.
 */
export function naiveDateTimeToUtcCarrier(value: string): Date {
  const { year, month, day, hour, minute, second } = parseNaiveDateTime(value);

  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

/** The inverse of {@link naiveDateTimeToUtcCarrier}. */
export function utcCarrierToNaiveDateTime(date: Date): string {
  return formatNaiveDateTime({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
  });
}

/** The UTC offset of `timeZone` at `date`, in milliseconds. */
function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = formatter
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour === '24' ? '0' : parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return asUtc - date.getTime();
}

/**
 * The real instant corresponding to naive local wall-clock digits interpreted
 * in `timeZone` (DST included). Two-pass `Intl.DateTimeFormat` offset lookup —
 * a first guess is corrected once against the offset it actually lands on.
 */
export function zonedInstant(value: string, timeZone: string): Date {
  const naive = parseNaiveDateTime(value);
  const naiveAsUtcMs = Date.UTC(
    naive.year,
    naive.month - 1,
    naive.day,
    naive.hour,
    naive.minute,
    naive.second,
  );

  let instantMs = naiveAsUtcMs;
  for (let i = 0; i < 2; i++) {
    const offset = timeZoneOffsetMs(new Date(instantMs), timeZone);
    instantMs = naiveAsUtcMs - offset;
  }

  return new Date(instantMs);
}
