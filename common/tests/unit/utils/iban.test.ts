import { describe, expect, it } from 'vitest';
import {
  formatIban,
  isValidBic,
  isValidIban,
  normalizeBic,
  normalizeIban,
} from '../../../src/utils/iban.js';

describe('isValidIban', () => {
  it.each([
    'DE89370400440532013000',
    'FR1420041010050500013M02606',
    'PL61109010140000071219812874',
    'CZ6508000000192000145399',
    'GB82WEST12345698765432',
    // Missing from the hand-written table this replaced.
    'LY83002048000020100120361',
    'OM810180000001299123456',
  ])('accepts %s', (iban) => {
    expect(isValidIban(iban)).toBe(true);
  });

  it('accepts spaces and lower case', () => {
    expect(isValidIban('de89 3704 0044 0532 0130 00')).toBe(true);
  });

  it('rejects wrong check digits', () => {
    expect(isValidIban('DE88370400440532013000')).toBe(false);
  });

  it('rejects the wrong length for the country', () => {
    expect(isValidIban('DE8937040044053201300')).toBe(false);
  });

  it('rejects unknown countries and garbage', () => {
    expect(isValidIban('ZZ89370400440532013000')).toBe(false);
    expect(isValidIban('')).toBe(false);
    expect(isValidIban('DE89-3704-0044')).toBe(false);
  });
});

describe('normalizeIban / formatIban', () => {
  it('strips spaces and upper-cases', () => {
    expect(normalizeIban(' de89 3704 0044 0532 0130 00 ')).toBe(
      'DE89370400440532013000',
    );
  });

  it('groups in blocks of four', () => {
    expect(formatIban('DE89370400440532013000')).toBe(
      'DE89 3704 0044 0532 0130 00',
    );
  });
});

describe('BIC', () => {
  it('accepts 8 and 11 characters once normalized', () => {
    expect(isValidBic(normalizeBic('cobade ff'))).toBe(true);
    expect(isValidBic('COBADEFFXXX')).toBe(true);
  });

  it('rejects an unknown country', () => {
    expect(isValidBic('COBAZZFF')).toBe(false);
  });

  it('rejects other lengths', () => {
    expect(isValidBic('COBADEF')).toBe(false);
    expect(isValidBic('COBADEFFXX')).toBe(false);
  });
});
