import { describe, expect, it } from 'vitest';
import {
  amountDue,
  paymentBalance,
  refundableAmount,
} from '../../../src/utils/paymentBalance.js';

const quoted = { quotedAmount: 20000, amountDueOverride: null };
const paid = (amount: number, refunds: [number, number][] = []) => ({
  amount,
  refunds: refunds.map(([refund, amountDueReduction]) => ({
    amount: refund,
    amountDueReduction,
  })),
});

describe('amountDue', () => {
  it('is the quote', () => {
    expect(amountDue(quoted, [])).toBe(20000);
  });

  it('prefers the set amount, even zero', () => {
    expect(amountDue({ quotedAmount: 20000, amountDueOverride: 0 }, [])).toBe(
      0,
    );
  });

  it('subtracts what cancellations took off, never below zero', () => {
    expect(amountDue(quoted, [paid(20000, [[5000, 5000]])])).toBe(15000);
    expect(amountDue(quoted, [paid(20000, [[20000, 30000]])])).toBe(0);
  });

  it('is null without a quote or a set amount', () => {
    expect(
      amountDue({ quotedAmount: null, amountDueOverride: null }, []),
    ).toBeNull();
  });
});

describe('paymentBalance', () => {
  const status = (source: typeof quoted, payments: ReturnType<typeof paid>[]) =>
    paymentBalance(source, 'EUR', payments).status;

  it('reads unpaid, partial, paid and overpaid', () => {
    expect(status(quoted, [])).toBe('UNPAID');
    expect(status(quoted, [paid(5000)])).toBe('PARTIAL');
    expect(status(quoted, [paid(5000), paid(15000)])).toBe('PAID');
    expect(status(quoted, [paid(25000)])).toBe('OVERPAID');
  });

  it('owes again once an overpayment refund went too far', () => {
    expect(status(quoted, [paid(20000, [[5000, 0]])])).toBe('PARTIAL');
  });

  it('reads refunded when a cancellation gave everything back', () => {
    expect(status(quoted, [paid(20000, [[20000, 20000]])])).toBe('REFUNDED');
  });

  it('needs nothing when nothing is due and nothing came in', () => {
    expect(status({ quotedAmount: 0, amountDueOverride: null }, [])).toBe(
      'NOT_REQUIRED',
    );
    expect(status({ quotedAmount: null, amountDueOverride: null }, [])).toBe(
      'NOT_REQUIRED',
    );
  });

  it('counts money without an amount due as paid, not overpaid', () => {
    const balance = paymentBalance(
      { quotedAmount: null, amountDueOverride: null },
      'EUR',
      [paid(5000)],
    );

    expect(balance).toMatchObject({ status: 'PAID', overpaid: 0 });
  });

  it('reports outstanding and the excess', () => {
    expect(paymentBalance(quoted, 'EUR', [paid(5000)])).toEqual({
      status: 'PARTIAL',
      currency: 'EUR',
      amountDue: 20000,
      amountPaid: 5000,
      outstanding: 15000,
      overpaid: 0,
    });
    expect(paymentBalance(quoted, 'EUR', [paid(23000)]).overpaid).toBe(3000);
  });
});

describe('refundableAmount', () => {
  it('is what is left of the payment', () => {
    expect(refundableAmount(paid(5000, [[2000, 0]]))).toBe(3000);
  });
});
