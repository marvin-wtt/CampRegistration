import { describe, expect, it } from 'vitest';
import { formatPhoneNumber } from '@/utils/formatPhoneNumber';

describe('formatPhoneNumber', () => {
  it('formats a number with a calling code', () => {
    expect(formatPhoneNumber('+4915123456789', { eventCountries: [] })).toBe(
      '+49 1512 3456789',
    );
  });

  it('reads a national number in the address country', () => {
    expect(
      formatPhoneNumber('0151 23456789', {
        country: 'de',
        eventCountries: ['fr'],
      }),
    ).toBe('+49 1512 3456789');
  });

  it("falls back to the event's only country", () => {
    expect(
      formatPhoneNumber('06 12 34 56 78', { eventCountries: ['fr'] }),
    ).toBe('+33 6 12 34 56 78');
  });

  it('keeps a national number as entered without a country', () => {
    expect(
      formatPhoneNumber('06 12 34 56 78', { eventCountries: ['fr', 'de'] }),
    ).toBe('06 12 34 56 78');
  });

  it('formats every number of a list', () => {
    expect(
      formatPhoneNumber('+4915123456789; +33612345678', { eventCountries: [] }),
    ).toBe('+49 1512 3456789, +33 6 12 34 56 78');
  });
});
