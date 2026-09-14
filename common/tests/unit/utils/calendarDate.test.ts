import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clampDate,
  currentDateInTimeZone,
} from '../../../src/utils/calendarDate.js';

describe('calendarDate', () => {
  describe('clampDate', () => {
    it('passes a date already within range through unchanged', () => {
      expect(clampDate('2026-07-15', '2026-07-01', '2026-07-31')).toBe(
        '2026-07-15',
      );
    });

    it('clamps up to the minimum', () => {
      expect(clampDate('2026-06-01', '2026-07-01', '2026-07-31')).toBe(
        '2026-07-01',
      );
    });

    it('clamps down to the maximum', () => {
      expect(clampDate('2026-08-01', '2026-07-01', '2026-07-31')).toBe(
        '2026-07-31',
      );
    });
  });

  describe('currentDateInTimeZone', () => {
    beforeEach(() => {
      // 2026-07-01T23:30:00Z — late evening UTC, so a negative-offset zone
      // (America/New_York) is still on 2026-07-01 while a positive-offset
      // zone (Europe/Berlin) has already rolled over to 2026-07-02.
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-01T23:30:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('reads the calendar date in the given timezone, not UTC', () => {
      expect(currentDateInTimeZone('Europe/Berlin')).toBe('2026-07-02');
      expect(currentDateInTimeZone('America/New_York')).toBe('2026-07-01');
    });
  });
});
