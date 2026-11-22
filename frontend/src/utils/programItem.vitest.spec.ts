import { describe, expect, it } from 'vitest';
import { formatProgramItemDuration } from '@/utils/programItem';

describe('formatProgramItemDuration', () => {
  it.each([
    [45, '45 min'],
    [60, '1 hr'],
    [90, '1 hr 30 min'],
    [150, '2 hr 30 min'],
  ])('formats %i minutes as "%s"', (minutes, expected) => {
    expect(formatProgramItemDuration(minutes, 'en')).toBe(expected);
  });

  it('uses the locale', () => {
    expect(formatProgramItemDuration(90, 'de')).toBe('1 Std. 30 Min.');
  });
});
