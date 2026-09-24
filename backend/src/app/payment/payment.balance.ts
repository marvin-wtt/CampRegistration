import type {
  RegistrationPayment,
  RegistrationPaymentStatus,
} from '@camp-registration/common/entities';
import type { Payment, PaymentRefund } from '#generated/prisma/client.js';

export type PaymentWithRefunds = Pick<Payment, 'status' | 'amount'> & {
  refunds: Pick<PaymentRefund, 'status' | 'amount'>[];
};

/** Refunds that took, or may still take, money back: everything not failed or canceled. */
export function countsAgainstPayment(
  refund: Pick<PaymentRefund, 'status'>,
): boolean {
  return refund.status === 'PENDING' || refund.status === 'REFUNDED';
}

export function refundedAmount(payment: PaymentWithRefunds): number {
  return payment.refunds
    .filter(countsAgainstPayment)
    .reduce((sum, refund) => sum + refund.amount, 0);
}

/** What a paid payment can still give back. */
export function refundableAmount(payment: PaymentWithRefunds): number {
  return payment.status === 'PAID'
    ? Math.max(0, payment.amount - refundedAmount(payment))
    : 0;
}

/**
 * A registration's balance from its ledger. Only `PAID` payments count as
 * money received; pending and refunded refunds are subtracted (a pending
 * refund is money the organizer has already decided to give back).
 */
export function registrationPayment(
  amountDue: number | null,
  currency: string,
  payments: PaymentWithRefunds[],
): RegistrationPayment {
  const paid = payments.filter((payment) => payment.status === 'PAID');
  const received = paid.reduce((sum, payment) => sum + payment.amount, 0);
  const refunded = paid.reduce(
    (sum, payment) => sum + refundedAmount(payment),
    0,
  );
  const amountPaid = received - refunded;

  return {
    status: paymentStatus(amountDue, received, amountPaid),
    currency,
    amountDue,
    amountPaid,
  };
}

function paymentStatus(
  amountDue: number | null,
  received: number,
  amountPaid: number,
): RegistrationPaymentStatus {
  if (received > 0 && amountPaid <= 0) {
    return 'REFUNDED';
  }
  if (amountDue === null || amountDue === 0) {
    return amountPaid > 0 ? 'PAID' : 'NOT_REQUIRED';
  }
  if (amountPaid >= amountDue) {
    return 'PAID';
  }

  return amountPaid > 0 ? 'PARTIAL' : 'UNPAID';
}

/** Outstanding balance in minor units, never negative. */
export function outstandingAmount(balance: RegistrationPayment): number {
  return Math.max(0, (balance.amountDue ?? 0) - balance.amountPaid);
}
