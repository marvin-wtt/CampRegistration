import { describe, expect, it } from 'vitest';
import { formatAddress } from '@/utils/formatAddress';

const translateCountry = (country: string) => country.toUpperCase();

describe('formatAddress', () => {
  it('returns string values unchanged', () => {
    expect(formatAddress('123 Main St', translateCountry)).toBe('123 Main St');
  });

  it('joins street, locality, and translated country', () => {
    expect(
      formatAddress(
        {
          street: 'Main St',
          nr: '5',
          zipCode: '12345',
          city: 'Springfield',
          country: 'us',
        },
        translateCountry,
      ),
    ).toBe('Main St 5, 12345 Springfield, US');
  });

  it('supports a single combined address field', () => {
    expect(
      formatAddress(
        { address: 'Main St 5', city: 'Springfield' },
        translateCountry,
      ),
    ).toBe('Main St 5, Springfield');
  });

  it('supports snake_case zip_code', () => {
    expect(
      formatAddress(
        { zip_code: '12345', city: 'Springfield' },
        translateCountry,
      ),
    ).toBe('12345 Springfield');
  });

  it('omits missing segments without leaving stray separators', () => {
    expect(formatAddress({ city: 'Springfield' }, translateCountry)).toBe(
      'Springfield',
    );
    expect(formatAddress({}, translateCountry)).toBe('');
  });

  it('falls back to JSON for non-object, non-string values', () => {
    expect(formatAddress(null, translateCountry)).toBe('null');
    expect(formatAddress(42, translateCountry)).toBe('42');
  });
});
