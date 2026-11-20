import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addToDate,
  clampDate,
  currentDateInTimeZone,
  daysBetween,
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

  describe('addToDate', () => {
    it('adds months and days', () => {
      expect(addToDate('2026-08-15', { months: 6 })).toBe('2027-02-15');
      expect(addToDate('2026-08-15', { days: 28 })).toBe('2026-09-12');
    });

    it('clamps to the last day of a shorter month', () => {
      expect(addToDate('2026-01-31', { months: 1 })).toBe('2026-02-28');
      expect(addToDate('2028-01-31', { months: 1 })).toBe('2028-02-29');
    });
  });

  describe('daysBetween', () => {
    it('counts whole days, negative backwards', () => {
      expect(daysBetween('2026-12-30', '2027-01-02')).toBe(3);
      expect(daysBetween('2027-01-02', '2026-12-30')).toBe(-3);
      expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    });
  });
});
