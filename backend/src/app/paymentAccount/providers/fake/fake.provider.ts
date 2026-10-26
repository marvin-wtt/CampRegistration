import type {
  PaymentStatus,
  RefundStatus,
} from '@camp-registration/common/entities';
import { ulid } from '#utils/ulid';
import { generateApiUrl } from '#utils/url';
import logger from '#core/logger';
import { describeError } from '#utils/errors';
import {
  type CheckoutInput,
  type CheckoutResult,
  type ConnectInput,
  type ConnectResult,
  InvalidCredentialsError,
  InvalidWebhookError,
  type PaymentProvider,
  type ProviderPaymentSnapshot,
  type RawBodyRequest,
  type RefundInput,
  type RefundResult,
} from '../payment.provider.js';

interface FakeRefund {
  id: string;
  reference: string;
  amount: number;
  status: RefundStatus;
  refundedAt: Date | null;
}

export interface FakePayment {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: PaymentStatus;
  paidAt: Date | null;
  returnUrl: string;
  webhookUrl: string;
  refunds: FakeRefund[];
}

// In-process only: the fake provider exists for development and e2e runs,
// which use a single backend process.
const payments = new Map<string, FakePayment>();

export function getFakePayment(id: string): FakePayment | undefined {
  return payments.get(id);
}

/** Notifies our own webhook, the way a real provider would. */
async function notify(payment: FakePayment): Promise<void> {
  try {
    await fetch(payment.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: payment.id }),
    });
  } catch (error) {
    logger.warn(`Fake payment webhook failed: ${describeError(error)}`);
  }
}

/** Settles a fake checkout, as the participant's choice on the fake checkout page. */
export async function completeFakePayment(
  id: string,
  outcome: 'PAID' | 'FAILED' | 'CANCELED',
): Promise<FakePayment | undefined> {
  const payment = payments.get(id);
  if (payment?.status !== 'OPEN') {
    return payment;
  }

  payment.status = outcome;
  payment.paidAt = outcome === 'PAID' ? new Date() : null;
  await notify(payment);

  return payment;
}

/**
 * A provider that moves no money, enabled by `PAYMENT_FAKE_PROVIDER` outside
 * production. Its checkout page is served by the payment module
 * (`fake-checkout.routes.ts`); refunds settle right after they're created.
 */
export class FakeProvider implements PaymentProvider {
  readonly name = 'fake' as const;

  connect({ apiKey }: ConnectInput): Promise<ConnectResult> {
    if (!apiKey.startsWith('fake_')) {
      return Promise.reject(
        new InvalidCredentialsError('A fake API key starts with "fake_".'),
      );
    }

    return Promise.resolve({
      credentials: { apiKey },
      mode: 'test',
      displayName: 'Fake payments',
    });
  }

  createCheckout(
    _credentials: unknown,
    input: CheckoutInput,
  ): Promise<CheckoutResult> {
    const id = `fake_${ulid()}`;
    payments.set(id, {
      id,
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      status: 'OPEN',
      paidAt: null,
      returnUrl: input.returnUrl,
      webhookUrl: input.webhookUrl,
      refunds: [],
    });

    return Promise.resolve({
      providerPaymentId: id,
      checkoutUrl: generateApiUrl([
        'webhooks',
        'payments',
        'fake',
        'checkout',
        id,
      ]),
      expiresAt: null,
    });
  }

  fetchPayment(
    _credentials: unknown,
    providerPaymentId: string,
  ): Promise<ProviderPaymentSnapshot> {
    const payment = payments.get(providerPaymentId);
    if (!payment) {
      return Promise.reject(
        new Error(`Unknown fake payment ${providerPaymentId}`),
      );
    }

    return Promise.resolve({
      providerPaymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      method: 'fake',
      paidAt: payment.paidAt,
      refunds: payment.refunds.map((refund) => ({
        providerRefundId: refund.id,
        reference: refund.reference,
        status: refund.status,
        amount: refund.amount,
        refundedAt: refund.refundedAt,
      })),
    });
  }

  parseWebhook(req: RawBodyRequest): Promise<string | null> {
    const id = (req.body as Record<string, unknown> | undefined)?.id;
    if (typeof id !== 'string' || !payments.has(id)) {
      return Promise.reject(new InvalidWebhookError('Unknown fake payment'));
    }

    return Promise.resolve(id);
  }

  createRefund(
    _credentials: unknown,
    providerPaymentId: string,
    input: RefundInput,
  ): Promise<RefundResult> {
    const payment = payments.get(providerPaymentId);
    if (!payment) {
      return Promise.reject(
        new Error(`Unknown fake payment ${providerPaymentId}`),
      );
    }

    const refund: FakeRefund = {
      id: `fake_re_${ulid()}`,
      reference: input.reference,
      amount: input.amount,
      status: 'PENDING',
      refundedAt: null,
    };
    payment.refunds.push(refund);

    // Settle asynchronously, like a real provider reporting back later.
    setImmediate(() => {
      refund.status = 'REFUNDED';
      refund.refundedAt = new Date();
      void notify(payment);
    });

    return Promise.resolve({
      providerRefundId: refund.id,
      status: 'PENDING',
    });
  }
}
