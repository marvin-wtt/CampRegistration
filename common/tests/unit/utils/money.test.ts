import { describe, expect, it } from 'vitest';
import {
  currencyFractionDigits,
  formatMoney,
  fromMinorUnits,
  toMinorUnits,
} from '../../../src/utils/money.js';

describe('money', () => {
  it('knows fraction digits per currency', () => {
    expect(currencyFractionDigits('EUR')).toBe(2);
    expect(currencyFractionDigits('JPY')).toBe(0);
    expect(currencyFractionDigits('KWD')).toBe(3);
  });

  it('converts to minor units without float noise', () => {
    expect(toMinorUnits(12.5, 'EUR')).toBe(1250);
    expect(toMinorUnits(1.005, 'EUR')).toBe(101);
    expect(toMinorUnits(0.1 + 0.2, 'EUR')).toBe(30);
    expect(toMinorUnits(1500, 'JPY')).toBe(1500);
    expect(toMinorUnits(1.2345, 'KWD')).toBe(1235);
    expect(toMinorUnits(-2.5, 'EUR')).toBe(-250);
  });

  it('converts back to major units', () => {
    expect(fromMinorUnits(1250, 'EUR')).toBe(12.5);
    expect(fromMinorUnits(1500, 'JPY')).toBe(1500);
  });

  it('formats in the given locale', () => {
    expect(formatMoney(1250, 'EUR', 'en-US')).toBe('€12.50');
    expect(formatMoney(1250, 'EUR', 'de-DE')).toMatch(/^12,50\s€$/);
    expect(formatMoney(1500, 'JPY', 'en-US')).toBe('¥1,500');
  });

  it('falls back when the locale is invalid', () => {
    expect(formatMoney(100, 'EUR', 'not a locale')).toContain('1');
  });
});
