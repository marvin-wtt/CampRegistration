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
  'NOT_REQUIRED' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';

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

export interface Payment extends Identifiable {
  registrationId: string | null;
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
}

/** A registration's balance, as embedded in `Registration.payment`. */
export interface RegistrationPayment {
  status: RegistrationPaymentStatus;
  currency: string;
  /** Minor units; `null` when no payment is required. */
  amountDue: number | null;
  /** Minor units: paid minus refunded. */
  amountPaid: number;
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
