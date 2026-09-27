import { describe, expect, it } from 'vitest';
import { eachDate, toDateString, toDbDate, weekdayOf } from '#utils/date';

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

  it('gives the weekday with Sunday as 0', () => {
    expect(weekdayOf('2026-09-27')).toBe(0);
    expect(weekdayOf('2026-09-28')).toBe(1);
  });
});
