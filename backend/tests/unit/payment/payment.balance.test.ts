import { describe, expect, it } from 'vitest';
import {
  outstandingAmount,
  refundableAmount,
  registrationPayment,
  type PaymentWithRefunds,
} from '#app/payment/payment.balance';

const paid = (
  amount: number,
  refunds: PaymentWithRefunds['refunds'] = [],
): PaymentWithRefunds => ({ status: 'PAID', amount, refunds });

describe('registrationPayment', () => {
  it('is NOT_REQUIRED without an amount due or payments', () => {
    expect(registrationPayment(null, 'EUR', [])).toEqual({
      status: 'NOT_REQUIRED',
      currency: 'EUR',
      amountDue: null,
      amountPaid: 0,
    });
  });

  it('is UNPAID while nothing was received', () => {
    const open: PaymentWithRefunds = {
      status: 'OPEN',
      amount: 5000,
      refunds: [],
    };

    expect(registrationPayment(5000, 'EUR', [open]).status).toBe('UNPAID');
  });

  it('is PARTIAL, then PAID as payments add up', () => {
    expect(registrationPayment(5000, 'EUR', [paid(2000)]).status).toBe(
      'PARTIAL',
    );
    expect(
      registrationPayment(5000, 'EUR', [paid(2000), paid(3000)]),
    ).toMatchObject({ status: 'PAID', amountPaid: 5000 });
  });

  it('subtracts pending and completed refunds, but not failed ones', () => {
    const payment = paid(5000, [
      { status: 'REFUNDED', amount: 1000 },
      { status: 'PENDING', amount: 500 },
      { status: 'FAILED', amount: 2000 },
      { status: 'CANCELED', amount: 2000 },
    ]);

    expect(registrationPayment(5000, 'EUR', [payment])).toMatchObject({
      status: 'PARTIAL',
      amountPaid: 3500,
    });
  });

  it('is REFUNDED once everything received went back', () => {
    const payment = paid(5000, [{ status: 'REFUNDED', amount: 5000 }]);

    expect(registrationPayment(5000, 'EUR', [payment]).status).toBe('REFUNDED');
  });

  it('counts payments even when none was required', () => {
    expect(registrationPayment(null, 'EUR', [paid(1000)]).status).toBe('PAID');
  });
});

describe('refundableAmount', () => {
  it('is what remains after refunds that count', () => {
    expect(
      refundableAmount(
        paid(5000, [
          { status: 'REFUNDED', amount: 1000 },
          { status: 'FAILED', amount: 4000 },
        ]),
      ),
    ).toBe(4000);
  });

  it('is zero for unpaid payments', () => {
    expect(
      refundableAmount({ status: 'OPEN', amount: 5000, refunds: [] }),
    ).toBe(0);
  });
});

describe('outstandingAmount', () => {
  it('never goes negative', () => {
    expect(
      outstandingAmount({
        status: 'PAID',
        currency: 'EUR',
        amountDue: 1000,
        amountPaid: 1500,
      }),
    ).toBe(0);
  });
});
