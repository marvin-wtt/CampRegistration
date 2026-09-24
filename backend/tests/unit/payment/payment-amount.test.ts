import { describe, expect, it } from 'vitest';
import { computeAmountDue } from '#app/payment/payment-amount';

const event = { price: 150, currency: 'EUR' };

describe('computeAmountDue', () => {
  it('falls back to the event price', () => {
    expect(computeAmountDue(event, {})).toBe(15000);
  });

  it('sums every value tagged payment_amount', () => {
    expect(computeAmountDue(event, { payment_amount: [100, 25.5, '10'] })).toBe(
      13550,
    );
  });

  it('uses a tagged zero instead of the price', () => {
    expect(computeAmountDue(event, { payment_amount: [0] })).toBe(0);
  });

  it('ignores unanswered or non-numeric tagged values', () => {
    expect(computeAmountDue(event, { payment_amount: [null, 'abc'] })).toBe(
      15000,
    );
  });

  it('never owes a negative amount', () => {
    expect(computeAmountDue(event, { payment_amount: [-20] })).toBe(0);
  });

  it('respects the currency’s minor unit', () => {
    expect(computeAmountDue({ price: 1500, currency: 'JPY' }, {})).toBe(1500);
  });
});
