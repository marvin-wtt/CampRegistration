import { describe, expect, it } from 'vitest';
import { eachDate, toDateString, toDbDate } from '#utils/date';

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
