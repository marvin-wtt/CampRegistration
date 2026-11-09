import { describe, expect, it } from 'vitest';
import { REGISTRATION_PRICE_CHANGED } from '@camp-registration/common/entities';
import { MAX_AMOUNT_DUE } from '@camp-registration/common/utils';
import {
  assertAmountWithinLimit,
  assertPriceUnchanged,
} from '#app/registration/registration.price-check';

describe('assertPriceUnchanged', () => {
  it('lets a submission through when the form showed the server quote', () => {
    expect(() => assertPriceUnchanged(20000, 20000)).not.toThrow();
  });

  it('compares nothing without a check', () => {
    expect(() => assertPriceUnchanged(20000, undefined)).not.toThrow();
  });

  it.each([0, 19999, 20001])(
    'refuses a displayed total of %d that differs from the quote',
    (displayedTotal) => {
      expect(() => assertPriceUnchanged(20000, displayedTotal)).toThrow(
        expect.objectContaining({
          statusCode: 409,
          code: REGISTRATION_PRICE_CHANGED,
        }),
      );
    },
  );
});

describe('assertAmountWithinLimit', () => {
  it('accepts the maximum', () => {
    expect(() => assertAmountWithinLimit(MAX_AMOUNT_DUE)).not.toThrow();
  });

  it('refuses more than can be stored', () => {
    expect(() => assertAmountWithinLimit(MAX_AMOUNT_DUE + 1)).toThrow(
      expect.objectContaining({ statusCode: 400 }),
    );
  });
});
