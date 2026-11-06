import { describe, expect, it } from 'vitest';
import { computeAmountDue } from '../../../src/utils/amountDue.js';

const event = { price: 150, currency: 'EUR' };

describe('computeAmountDue', () => {
  it('charges the event price without tagged answers', () => {
    expect(computeAmountDue(event, [])).toBe(15000);
  });

  it('adds every value tagged payment_amount to the price', () => {
    expect(computeAmountDue(event, [100, 25.5, '10'])).toBe(28550);
  });

  it('subtracts a discount from the price', () => {
    expect(computeAmountDue(event, [-20])).toBe(13000);
  });

  it('ignores unanswered or non-numeric tagged values', () => {
    expect(computeAmountDue(event, [null, 'abc'])).toBe(15000);
  });

  it('never owes a negative amount', () => {
    expect(computeAmountDue(event, [-200])).toBe(0);
  });

  it('respects the currency’s minor unit', () => {
    expect(computeAmountDue({ price: 1500, currency: 'JPY' }, [])).toBe(1500);
  });
});
