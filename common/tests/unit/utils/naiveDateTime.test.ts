import { describe, expect, it } from 'vitest';
import {
  formatNaiveDateTime,
  localDateToNaiveDateTime,
  naiveDateTimeToUtcCarrier,
  parseNaiveDateTime,
  utcCarrierToNaiveDateTime,
  zonedInstant,
} from '../../../src/utils/naiveDateTime.js';

describe('naiveDateTime', () => {
  describe('parseNaiveDateTime / formatNaiveDateTime', () => {
    it('round-trips a naive datetime string', () => {
      const value = '2026-07-01T09:05:30';

      expect(formatNaiveDateTime(parseNaiveDateTime(value))).toBe(value);
    });

    it('requires seconds', () => {
      expect(() => parseNaiveDateTime('2026-07-01T09:05')).toThrow();
    });

    it('throws on a value carrying a Z suffix', () => {
      expect(() => parseNaiveDateTime('2026-07-01T09:05:30Z')).toThrow();
    });

    it('throws on a value carrying an offset', () => {
      expect(() => parseNaiveDateTime('2026-07-01T09:05:30+02:00')).toThrow();
    });
  });

  describe('localDateToNaiveDateTime', () => {
    it('reads the date through its local getters, not UTC', () => {
      const date = new Date(2026, 6, 1, 9, 5, 30); // month is 0-based

      expect(localDateToNaiveDateTime(date)).toBe('2026-07-01T09:05:30');
    });
  });

  describe('naiveDateTimeToUtcCarrier / utcCarrierToNaiveDateTime', () => {
    it('round-trips regardless of the digits, independent of any runtime zone', () => {
      const value = '2026-12-31T23:59:59';
      const carrier = naiveDateTimeToUtcCarrier(value);

      expect(carrier.toISOString()).toBe('2026-12-31T23:59:59.000Z');
      expect(utcCarrierToNaiveDateTime(carrier)).toBe(value);
    });
  });

  describe('zonedInstant', () => {
    it('converts a naive datetime to the correct UTC instant outside DST', () => {
      // Europe/Berlin is UTC+1 in January (CET).
      const instant = zonedInstant('2026-01-15T09:00:00', 'Europe/Berlin');

      expect(instant.toISOString()).toBe('2026-01-15T08:00:00.000Z');
    });

    it('converts a naive datetime to the correct UTC instant during DST', () => {
      // Europe/Berlin is UTC+2 in July (CEST).
      const instant = zonedInstant('2026-07-01T09:00:00', 'Europe/Berlin');

      expect(instant.toISOString()).toBe('2026-07-01T07:00:00.000Z');
    });

    it('handles the DST spring-forward transition', () => {
      // 2026-03-29 02:00 CET -> 03:00 CEST in Europe/Berlin.
      const instant = zonedInstant('2026-03-29T04:00:00', 'Europe/Berlin');

      expect(instant.toISOString()).toBe('2026-03-29T02:00:00.000Z');
    });

    it('handles the DST fall-back transition', () => {
      // 2026-10-25 03:00 CEST -> 02:00 CET in Europe/Berlin.
      const instant = zonedInstant('2026-10-25T04:00:00', 'Europe/Berlin');

      expect(instant.toISOString()).toBe('2026-10-25T03:00:00.000Z');
    });

    it('agrees with UTC for the UTC zone', () => {
      const value = '2026-05-20T12:34:56';

      expect(zonedInstant(value, 'UTC').toISOString()).toBe(
        '2026-05-20T12:34:56.000Z',
      );
    });
  });
});
