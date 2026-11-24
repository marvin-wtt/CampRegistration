import type { Identifiable } from './Identifiable.js';
import type { Timestamps } from './Timestamps.js';
import type { Registration } from './Registration.js';

/** Where a payment came from; providers join later (docs/payments.md). */
export type PaymentSource = 'MANUAL';

/** Manual payments are recorded once the money arrived. */
export type PaymentStatus = 'PAID';

export type PaymentRefundStatus = 'REFUNDED';

export const PAYMENT_METHODS = ['BANK_TRANSFER', 'CASH', 'OTHER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * How money still held was settled when its registration was deleted: kept
 * (a cancellation fee, say) or given back outside the ledger.
 */
export const PAYMENT_SETTLEMENTS = ['RETAINED'] as const;
export type PaymentSettlement = (typeof PAYMENT_SETTLEMENTS)[number];

/** A registration fee going back — not an expense of type `REFUND`. */
export interface PaymentRefund extends Identifiable {
  paymentId: string;
  status: PaymentRefundStatus;
  /** Minor units of the payment's currency. */
  amount: number;
  /** `YYYY-MM-DD` the money went back. */
  refundedOn: string;
  reason: string | null;
  /** What it took off the amount due; `0` for an overpayment. */
  amountDueReduction: number;
  createdByUserId: string | null;
  createdAt: string;
}

export interface Payment extends Identifiable, Timestamps {
  /** `null` once the registration was deleted; see `registrationRef`. */
  registrationId: string | null;
  /** The registration it was recorded for, kept after it is deleted. */
  registrationRef: string;
  /** Who paid, kept for the books; cleared after the retention period. */
  payerName: string | null;
  source: PaymentSource;
  status: PaymentStatus;
  /** Minor units of `currency`. */
  amount: number;
  currency: string;
  method: PaymentMethod;
  /** `YYYY-MM-DD` booking date. */
  paidOn: string;
  note: string | null;
  settlement: PaymentSettlement | null;
  refunds: PaymentRefund[];
  /** What can still be refunded of it, in minor units. */
  refundable: number;
  createdByUserId: string | null;
}

/**
 * `NOT_REQUIRED`: nothing is due and nothing was paid. `REFUNDED`: money came
 * in and all of it went back.
 */
export type PaymentBalanceStatus =
  'NOT_REQUIRED' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERPAID' | 'REFUNDED';

/** A registration's balance, derived from its ledger. Minor units. */
export interface PaymentBalance {
  status: PaymentBalanceStatus;
  currency: string;
  /** `null` on a registration with neither a quote nor a set amount. */
  amountDue: number | null;
  /** Paid minus refunded. */
  amountPaid: number;
  /** Still owed, never negative. */
  outstanding: number;
  /** Paid beyond the amount due, never negative. */
  overpaid: number;
}

/** Where the amount due comes from. */
export interface AmountDueDetails {
  /** What the form quoted; `null` on registrations predating quotes. */
  quotedAmount: number | null;
  /** Set by hand in place of the quote. */
  override: number | null;
  note: string | null;
  adjustedAt: string | null;
  /** What refunds took off it (cancellations). */
  reductions: number;
}

/**
 * A registration as the fees view sees it: a fixed allowlist, never the
 * answers (docs/payments.md, "Treasurer's view").
 */
export interface RegistrationFee extends Identifiable {
  /** The transfer reference: `K7MX-0042`. */
  reference: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  status: Registration['status'];
  /** The registration's group, by its country code. */
  group: string | null;
  createdAt: string;
  amountDue: AmountDueDetails;
  balance: PaymentBalance;
  payments: Payment[];
}

export interface PaymentCreateData {
  /** Minor units. */
  amount: number;
  method: PaymentMethod;
  paidOn: string;
  note?: string | null | undefined;
}

export type PaymentUpdateData = Partial<Pick<Payment, 'paidOn' | 'note'>>;

export interface PaymentRefundCreateData {
  /** Minor units, at most the payment's `refundable`. */
  amount: number;
  refundedOn: string;
  reason?: string | null | undefined;
  /**
   * A cancellation: the amount due drops by the part of the refund beyond any
   * overpayment. Without it, refunding only gives back an excess.
   */
  reduceAmountDue?: boolean | undefined;
}

export interface AmountDueUpdateData {
  /** Minor units; `null` goes back to the quote. */
  amount: number | null;
  note?: string | null | undefined;
}

/** Deleting a registration that still holds money needs one. */
export const PAYMENT_SETTLEMENT_REQUIRED = 'PAYMENT_SETTLEMENT_REQUIRED';
