import { describe, expect, it } from 'vitest';
import { formatLocalDate, isoToLocalDate } from '@/utils/date';

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
