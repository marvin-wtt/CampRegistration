import type { Request } from 'express';
import type {
  PaymentProviderName,
  PaymentStatus,
  RefundStatus,
} from '@camp-registration/common/entities';

/** Provider-specific secrets, stored encrypted on `PaymentAccount.credentials`. */
export type ProviderCredentials = Record<string, string>;

export type ProviderName = PaymentProviderName;

export interface ConnectInput {
  apiKey: string;
  /** The account's webhook URL, for providers that register one up front (Stripe). */
  webhookUrl: string;
}

export interface ConnectResult {
  credentials: ProviderCredentials;
  mode: 'test' | 'live';
  displayName: string | null;
}

export interface CheckoutInput {
  /** Minor units. */
  amount: number;
  currency: string;
  description: string;
  /** Our `Payment.id`, echoed back by the provider for correlation. */
  reference: string;
  locale: string;
  email: string | null;
  returnUrl: string;
  webhookUrl: string;
}

export interface CheckoutResult {
  providerPaymentId: string;
  checkoutUrl: string;
  expiresAt: Date | null;
}

export interface RefundInput {
  /** Minor units. */
  amount: number;
  currency: string;
  reason: string | null;
  /** Our `PaymentRefund.id`, echoed back by the provider and used as idempotency key. */
  reference: string;
}

export interface RefundResult {
  providerRefundId: string;
  status: RefundStatus;
}

export interface ProviderRefundSnapshot {
  providerRefundId: string;
  /** Our `PaymentRefund.id` when the refund was created through the app. */
  reference: string | null;
  status: RefundStatus;
  /** Minor units. */
  amount: number;
  refundedAt: Date | null;
}

/** The provider's authoritative view of one payment, fetched — never taken from a webhook body. */
export interface ProviderPaymentSnapshot {
  providerPaymentId: string;
  status: PaymentStatus;
  /** Minor units. */
  amount: number;
  currency: string;
  method: string | null;
  paidAt: Date | null;
  refunds: ProviderRefundSnapshot[];
}

export type RawBodyRequest = Request & { rawBody?: Buffer };

/**
 * A payment service provider. Implementations are stateless: every call gets
 * the account's decrypted credentials, since one process serves many
 * organizations' accounts. The core (`PaymentService`) only ever talks to
 * this interface.
 */
export interface PaymentProvider {
  readonly name: ProviderName;

  /** Validates the API key and prepares the account (e.g. registers Stripe's webhook endpoint). */
  connect(input: ConnectInput): Promise<ConnectResult>;

  /** Tears down whatever `connect` set up on the provider side. Best effort. */
  disconnect?(credentials: ProviderCredentials): Promise<void>;

  createCheckout(
    credentials: ProviderCredentials,
    input: CheckoutInput,
  ): Promise<CheckoutResult>;

  fetchPayment(
    credentials: ProviderCredentials,
    providerPaymentId: string,
  ): Promise<ProviderPaymentSnapshot>;

  /**
   * Authenticates an incoming webhook and returns the provider payment id it
   * refers to, or `null` for a genuine event that doesn't concern a payment
   * of ours. Throws `InvalidWebhookError` when the request is not authentic.
   */
  parseWebhook(
    req: RawBodyRequest,
    credentials: ProviderCredentials,
  ): Promise<string | null>;

  createRefund(
    credentials: ProviderCredentials,
    providerPaymentId: string,
    input: RefundInput,
  ): Promise<RefundResult>;
}

export class InvalidWebhookError extends Error {}

/** The API key was rejected by the provider when connecting. */
export class InvalidCredentialsError extends Error {}
