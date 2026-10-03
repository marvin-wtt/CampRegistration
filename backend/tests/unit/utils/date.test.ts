import { describe, expect, it } from 'vitest';
import {
  addMonths,
  dayOf,
  eachDate,
  eachMonth,
  monthOf,
  monthRange,
  toDateString,
  toDbDate,
} from '#utils/date';

describe('date', () => {
  it('round-trips a date-only value through UTC midnight', () => {
    expect(toDbDate('2026-08-31').toISOString()).toBe(
      '2026-08-31T00:00:00.000Z',
    );
    expect(toDateString(toDbDate('2026-08-31'))).toBe('2026-08-31');
  });

  it('lists every date in the range, inclusive, across month ends', () => {
    expect(eachDate('2026-08-30', '2026-09-02')).toEqual([
      '2026-08-30',
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
    ]);
    expect(eachDate('2026-08-31', '2026-08-31')).toEqual(['2026-08-31']);
    expect(eachDate('2026-09-01', '2026-08-31')).toEqual([]);
  });
});

describe('months', () => {
  it('reads the month of an instant in the given time zone', () => {
    // 23:30 UTC on 31 Jan is already 1 Feb in Berlin.
    const instant = new Date('2026-01-31T23:30:00Z');

    expect(monthOf(instant, 'UTC')).toBe('2026-01');
    expect(monthOf(instant, 'Europe/Berlin')).toBe('2026-02');
    expect(dayOf(instant, 'Europe/Berlin')).toBe('2026-02-01');
  });

  it('moves across year boundaries', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2025-12', 1)).toBe('2026-01');
    expect(addMonths('2026-10', -11)).toBe('2025-11');
  });

  it('lists every month of a range', () => {
    expect(eachMonth('2025-11', '2026-02')).toEqual([
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
    ]);
  });

  it('bounds a month by its local midnights', () => {
    const { start, end } = monthRange('2026-03', 'Europe/Berlin');

    expect(start.toISOString()).toBe('2026-02-28T23:00:00.000Z');
    // Summer time starts on 29 Mar, so April begins at UTC+2.
    expect(end.toISOString()).toBe('2026-03-31T22:00:00.000Z');
  });
});
