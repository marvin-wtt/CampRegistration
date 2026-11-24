import { describe, expect, it } from 'vitest';
import {
  formatPaymentReference,
  parsePaymentReference,
} from '../../../src/utils/paymentReference.js';

describe('formatPaymentReference', () => {
  it('pads the number to four digits', () => {
    expect(formatPaymentReference('K7MX', 42)).toBe('K7MX-0042');
  });

  it('keeps longer numbers whole', () => {
    expect(formatPaymentReference('K7MX', 12345)).toBe('K7MX-12345');
  });
});

describe('parsePaymentReference', () => {
  it('reads a reference however it was typed', () => {
    for (const input of ['K7MX-0042', 'k7mx0042', ' K7MX - 42 ']) {
      expect(parsePaymentReference(input)).toEqual({
        code: 'K7MX',
        number: 42,
      });
    }
  });

  it('refuses anything else', () => {
    expect(parsePaymentReference('Anna Camp')).toBeNull();
    expect(parsePaymentReference('K7M-0042')).toBeNull();
  });
});
