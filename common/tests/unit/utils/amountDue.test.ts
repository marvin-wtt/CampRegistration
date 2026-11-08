import { describe, expect, it } from 'vitest';
import { computeAmountDue, groupPrice } from '../../../src/utils/amountDue.js';

// Minor units, as stored.
const event = { price: 15000, currency: 'EUR' };

describe('computeAmountDue', () => {
  it('charges the event price without tagged answers', () => {
    expect(computeAmountDue(event, [], null)).toBe(15000);
  });

  it('adds every value tagged payment_amount to the price', () => {
    expect(computeAmountDue(event, [100, 25.5, '10'], null)).toBe(28550);
  });

  it('subtracts a discount from the price', () => {
    expect(computeAmountDue(event, [-20], null)).toBe(13000);
  });

  it('ignores unanswered or non-numeric tagged values', () => {
    expect(computeAmountDue(event, [null, 'abc'], null)).toBe(15000);
  });

  it('never owes a negative amount', () => {
    expect(computeAmountDue(event, [-200], null)).toBe(0);
  });

  it('respects the currency’s minor unit', () => {
    expect(computeAmountDue({ price: 1500, currency: 'JPY' }, [5], null)).toBe(
      1505,
    );
  });

  it('charges the price of the registration’s group', () => {
    const perGroup = { price: { de: 15000, pl: 12000 }, currency: 'EUR' };

    expect(computeAmountDue(perGroup, [10], 'pl')).toBe(13000);
    expect(computeAmountDue(perGroup, [], 'de')).toBe(15000);
  });
});

describe('groupPrice', () => {
  it('is the one price for every group', () => {
    expect(groupPrice(15000, 'pl')).toBe(15000);
  });

  it('is the highest without a group the event has a price for', () => {
    expect(groupPrice({ de: 15000, pl: 12000 }, null)).toBe(15000);
    expect(groupPrice({ de: 15000, pl: 12000 }, 'fr')).toBe(15000);
  });
});
