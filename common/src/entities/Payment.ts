import type { Identifiable } from './Identifiable.js';

/**
 * Online payment providers an organization can connect. `fake` moves no money
 * and is only offered outside production (`PAYMENT_FAKE_PROVIDER`).
 */
export type PaymentProviderName = 'mollie' | 'stripe' | 'fake';

/** Where a ledger entry came from: a connected provider, or entered by hand. */
export type PaymentSource = PaymentProviderName | 'manual';

/**
 * Lifecycle of a single payment attempt. Only ever moves forward; `PAID` is
 * terminal — money flowing back is recorded as {@link PaymentRefund} rows, never
 * as a payment status, so partial and repeated refunds need no extra states.
 */
export type PaymentStatus =
  'OPEN' | 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED' | 'EXPIRED';

export type RefundStatus = 'PENDING' | 'REFUNDED' | 'FAILED' | 'CANCELED';

/**
 * A registration's overall payment state, derived from its ledger:
 * `REFUNDED` means money was paid and the net paid amount is back to zero.
 */
export type RegistrationPaymentStatus =
  | 'NOT_REQUIRED'
  | 'UNPAID'
  | 'PARTIAL'
  | 'PAID'
  | 'OVERPAID'
  | 'REFUNDED';

export interface PaymentRefund extends Identifiable {
  paymentId: string;
  status: RefundStatus;
  /** Minor units (e.g. cents) of the payment's currency. */
  amount: number;
  reason: string | null;
  /** Name of the manager who issued it; `null` when made in the provider dashboard. */
  createdBy: string | null;
  refundedAt: string | null;
  createdAt: string;
}

/**
 * How money still held was settled when its registration was deleted:
 * kept (e.g. as a cancellation fee) or already given back outside the app.
 */
export type PaymentSettlement = 'retained' | 'settled_outside';

export const PAYMENT_SETTLEMENTS: readonly PaymentSettlement[] = [
  'retained',
  'settled_outside',
];

export interface Payment extends Identifiable {
  /** `null` once the registration was deleted; see `registrationRef`. */
  registrationId: string | null;
  /** The registration it was made for, kept after that is deleted. */
  registrationRef: string | null;
  /** Who paid, kept for accounting; removed after the retention period. */
  payerName: string | null;
  settlement: PaymentSettlement | null;
  source: PaymentSource;
  status: PaymentStatus;
  /** Minor units (e.g. cents) of {@link currency}. */
  amount: number;
  /** Sum of the refunds that are pending or completed, in minor units. */
  amountRefunded: number;
  currency: string;
  method: string | null;
  note: string | null;
  paidAt: string | null;
  createdBy: string | null;
  createdAt: string;
  refunds: PaymentRefund[];
}

export interface PaymentCreateData {
  /** Major units, as entered (e.g. `12.5` for 12.50 EUR). */
  amount: number;
  paidAt?: string | undefined;
  method?: string | null | undefined;
  note?: string | null | undefined;
}

export interface PaymentRefundCreateData {
  /** Minor units. */
  amount: number;
  reason?: string | null | undefined;
  suppressMessage?: boolean | undefined;
  /**
   * The money went back outside the app (cash, bank transfer): recorded as
   * done, without the provider. Manual payments are always refunded so.
   */
  outsideApp?: boolean | undefined;
  /**
   * The refund lowers the price (late arrival, goodwill): what is owed drops
   * by the same amount, so the registration doesn't owe it again. Without
   * it, the debt stays — e.g. money returned before charging correctly.
   */
  reduceAmountDue?: boolean | undefined;
}

/** A registration's balance, as embedded in `Registration.payment`. */
export interface RegistrationPayment {
  status: RegistrationPaymentStatus;
  currency: string;
  /** Minor units; `null` when no payment is required. */
  amountDue: number | null;
  /** Minor units: paid minus refunded. */
  amountPaid: number;
  /** Minor units still owed, never negative. */
  outstanding: number;
  /** Minor units paid beyond the amount due, never negative. */
  overpaid: number;
}

/** A manager's fixed `amountDue`, replacing the one calculated from the answers. */
export interface AmountDueAdjustment {
  note: string | null;
  adjustedAt: string;
}

/** A registration's balance as managers see it. */
export interface RegistrationPaymentDetails extends RegistrationPayment {
  /**
   * Minor units: what the server calculated, and the form showed, at
   * submission. `null` on registrations predating it.
   */
  quotedAmount: number | null;
  adjustment: AmountDueAdjustment | null;
  /** When the person was last asked to pay, and last reminded. */
  requestedAt: string | null;
  remindedAt: string | null;
}

/**
 * Sets what a registration owes. `amount` is in major units; `null` goes back
 * to the quoted amount — what the registration form showed.
 */
export interface AmountDueUpdateData {
  amount: number | null;
  note?: string | null | undefined;
}

/** The public, token-authenticated view of a registration's balance. */
export interface RegistrationPaymentSummary extends RegistrationPayment {
  registrationId: string;
  eventId: string;
  /** Status of the most recent provider payment attempt, if any. */
  latestPaymentStatus: PaymentStatus | null;
  /** Whether the participant can start a checkout right now. */
  payable: boolean;
}

export interface PaymentCheckout {
  checkoutUrl: string;
}

/**
 * Returned as `meta.payment` when a registration that owes money is created,
 * to the submitter only. `checkoutUrl` is set when the event charges at
 * registration and a checkout could be opened right away; `pageUrl` is the
 * participant's (token-carrying) payment page either way.
 */
export interface RegistrationCreatePaymentMeta {
  checkoutUrl: string | null;
  pageUrl: string;
}

/** An organization's connected provider account. Never carries credentials. */
export interface PaymentAccount {
  provider: PaymentProviderName;
  mode: 'test' | 'live';
  displayName: string | null;
  connectedAt: string;
}

/**
 * Whether an event can take online payments right now, for its payment
 * settings. Readable by the event's editors, who may not be able to see the
 * organization's account itself.
 */
export interface EventPaymentStatus {
  account: Pick<PaymentAccount, 'provider' | 'mode'> | null;
  organizationVerified: boolean;
  /** Accepted registrations that owe money but were never asked to pay. */
  unrequested: number;
  /** Once anything was quoted or paid, the event's currency is fixed. */
  currencyLocked: boolean;
}

/** The outcome of asking every accepted registration that owes money. */
export interface PaymentRequestResult {
  requested: number;
}

/** Which providers this deployment offers, for the connect form. */
export interface PaymentProviderOptions {
  providers: PaymentProviderName[];
  /** Whether credentials can be stored at all (requires encryption keys). */
  available: boolean;
}

export interface PaymentAccountConnectData {
  provider: PaymentProviderName;
  apiKey: string;
}
