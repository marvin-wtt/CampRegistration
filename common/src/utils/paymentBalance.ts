import type {
  PaymentBalance,
  PaymentBalanceStatus,
} from '../entities/Payment.js';

/** A payment as far as its balance needs it. */
export interface PaymentLedgerEntry {
  amount: number;
  refunds: { amount: number; amountDueReduction: number }[];
}

/** What decides a registration's amount due (docs/payments.md). */
export interface AmountDueSource {
  quotedAmount: number | null;
  amountDueOverride: number | null;
}

export function refundedAmount(payment: PaymentLedgerEntry): number {
  return payment.refunds.reduce((sum, refund) => sum + refund.amount, 0);
}

/** What a payment can still give back. */
export function refundableAmount(payment: PaymentLedgerEntry): number {
  return Math.max(0, payment.amount - refundedAmount(payment));
}

/** What refunds took off the amount due. */
export function amountDueReductions(payments: PaymentLedgerEntry[]): number {
  return payments
    .flatMap((payment) => payment.refunds)
    .reduce((sum, refund) => sum + refund.amountDueReduction, 0);
}

/**
 * The set amount or the quote, minus what cancellations took off, never
 * below zero; `null` without either.
 */
export function amountDue(
  source: AmountDueSource,
  payments: PaymentLedgerEntry[],
): number | null {
  const base = source.amountDueOverride ?? source.quotedAmount;
  if (base === null) {
    return null;
  }

  return Math.max(0, base - amountDueReductions(payments));
}

export function paymentBalance(
  source: AmountDueSource,
  currency: string,
  payments: PaymentLedgerEntry[],
): PaymentBalance {
  const due = amountDue(source, payments);
  const received = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const amountPaid =
    received -
    payments.reduce((sum, payment) => sum + refundedAmount(payment), 0);

  return {
    status: balanceStatus(due, received, amountPaid),
    currency,
    amountDue: due,
    amountPaid,
    outstanding: Math.max(0, (due ?? 0) - amountPaid),
    overpaid: due === null ? 0 : Math.max(0, amountPaid - due),
  };
}

function balanceStatus(
  due: number | null,
  received: number,
  amountPaid: number,
): PaymentBalanceStatus {
  if (received > 0 && amountPaid === 0 && !due) {
    return 'REFUNDED';
  }
  if (due !== null && amountPaid > due) {
    return 'OVERPAID';
  }
  if (!due) {
    return amountPaid > 0 ? 'PAID' : 'NOT_REQUIRED';
  }
  if (amountPaid === due) {
    return 'PAID';
  }

  return amountPaid > 0 ? 'PARTIAL' : 'UNPAID';
}
