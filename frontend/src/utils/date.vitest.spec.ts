import { describe, expect, it } from 'vitest';
import { addDays, formatLocalDate, isoToLocalDate } from '@/utils/date';

describe('formatLocalDate', () => {
  it('formats the local calendar day', () => {
    expect(formatLocalDate(new Date(2026, 7, 1, 0, 0))).toBe('2026-08-01');
    expect(formatLocalDate(new Date(2026, 7, 1, 23, 59))).toBe('2026-08-01');
  });
});

describe('isoToLocalDate', () => {
  // The ISO date part is a day off whenever the local time of day falls on the
  // other side of midnight in UTC, so midnight is the interesting case.
  it.each([
    ['midnight', new Date(2026, 7, 1, 0, 0)],
    ['noon', new Date(2026, 7, 1, 12, 0)],
    ['end of day', new Date(2026, 7, 1, 23, 59)],
  ])('returns the local day for %s', (_label, local) => {
    expect(isoToLocalDate(local.toISOString())).toBe('2026-08-01');
  });
});

describe('addDays', () => {
  it('adds days within a month', () => {
    expect(addDays('2026-07-01', 3)).toBe('2026-07-04');
  });

  it('rolls over a month boundary', () => {
    expect(addDays('2026-07-30', 3)).toBe('2026-08-02');
  });

  it('rolls over a year boundary', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('subtracts days for a negative amount', () => {
    expect(addDays('2026-07-01', -1)).toBe('2026-06-30');
  });
});
