import { describe, expect, it } from 'vitest';
import {
  amountDigits,
  amountFromInput,
  formatAmountDigits,
} from '@/utils/moneyInput';

describe('amountDigits', () => {
  it.each([
    ['4780', '4780'],
    ['47,80', '4780'],
    ['1.234,50 €', '123450'],
    ['0,05', '5'],
    ['0,00', ''],
    ['abc', ''],
    ['12345678901', '123456789'],
  ])('reads %j as %j', (text, digits) => {
    expect(amountDigits(text)).toBe(digits);
  });
});

describe('amountFromInput', () => {
  it.each([
    ['47,80', 4780],
    ['0', 0],
    ['0,00 €', 0],
    ['', null],
    ['€', null],
  ])('reads %j as %j', (text, amount) => {
    expect(amountFromInput(text)).toBe(amount);
  });
});

describe('formatAmountDigits', () => {
  it('formats with the locale separators', () => {
    expect(formatAmountDigits(123450, 'EUR', 'de-DE')).toBe('1.234,50');
    expect(formatAmountDigits(123450, 'EUR', 'en-US')).toBe('1,234.50');
    expect(formatAmountDigits(5, 'EUR', 'de-DE')).toBe('0,05');
  });

  it('follows the currency fraction digits', () => {
    expect(formatAmountDigits(1500, 'JPY', 'en-US')).toBe('1,500');
  });
});
