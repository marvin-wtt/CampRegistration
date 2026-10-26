import createMollieClient, {
  Locale,
  MollieApiError,
  PaymentStatus as MolliePaymentStatus,
  RefundStatus as MollieRefundStatus,
  type MollieClient,
} from '@mollie/api-client';
import type {
  PaymentStatus,
  RefundStatus,
} from '@camp-registration/common/entities';
import {
  type CheckoutInput,
  type CheckoutResult,
  type ConnectInput,
  type ConnectResult,
  InvalidCredentialsError,
  InvalidWebhookError,
  type PaymentProvider,
  type ProviderCredentials,
  type ProviderPaymentSnapshot,
  type RawBodyRequest,
  type RefundInput,
  type RefundResult,
} from '../payment.provider.js';
import { fromDecimalString, toDecimalString } from '../money.js';

const PAYMENT_STATUS: Record<MolliePaymentStatus, PaymentStatus> = {
  [MolliePaymentStatus.open]: 'OPEN',
  [MolliePaymentStatus.pending]: 'PENDING',
  [MolliePaymentStatus.authorized]: 'PENDING',
  [MolliePaymentStatus.paid]: 'PAID',
  [MolliePaymentStatus.failed]: 'FAILED',
  [MolliePaymentStatus.canceled]: 'CANCELED',
  [MolliePaymentStatus.expired]: 'EXPIRED',
};

const REFUND_STATUS: Record<MollieRefundStatus, RefundStatus> = {
  [MollieRefundStatus.queued]: 'PENDING',
  [MollieRefundStatus.pending]: 'PENDING',
  [MollieRefundStatus.processing]: 'PENDING',
  [MollieRefundStatus.refunded]: 'REFUNDED',
  [MollieRefundStatus.failed]: 'FAILED',
  [MollieRefundStatus.canceled]: 'CANCELED',
};

const LOCALES = new Set<string>(Object.values(Locale));

/** `de-DE` → `de_DE` when Mollie supports it; otherwise Mollie picks from the browser. */
function mollieLocale(locale: string): Locale | undefined {
  const candidate = locale.replace('-', '_');

  return LOCALES.has(candidate) ? (candidate as Locale) : undefined;
}

/** Mollie can't reach a local dev server and rejects such webhook URLs outright. */
function isPublicUrl(url: string): boolean {
  const { hostname } = new URL(url);

  return !(
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  );
}

function metadataReference(metadata: unknown, key: string): string | null {
  if (metadata && typeof metadata === 'object' && key in metadata) {
    const value = (metadata as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : null;
  }

  return null;
}

/**
 * Mollie Payments API. Mollie webhooks carry only the payment id (`id=tr_…`)
 * and are unsigned by design — the snapshot is always re-fetched with the
 * account's own key, so a forged call can at most trigger a harmless re-sync.
 * Refund changes arrive on the same payment webhook.
 */
export class MollieProvider implements PaymentProvider {
  readonly name = 'mollie' as const;

  private client(credentials: ProviderCredentials): MollieClient {
    return createMollieClient({ apiKey: credentials.apiKey });
  }

  async connect({ apiKey }: ConnectInput): Promise<ConnectResult> {
    const mode = apiKey.startsWith('live_')
      ? 'live'
      : apiKey.startsWith('test_')
        ? 'test'
        : null;
    if (!mode) {
      throw new InvalidCredentialsError(
        'A Mollie API key starts with "live_" or "test_".',
      );
    }

    try {
      const profile = await createMollieClient({
        apiKey,
      }).profiles.getCurrent();

      return {
        credentials: { apiKey },
        mode,
        displayName: profile.name,
      };
    } catch (error) {
      if (error instanceof MollieApiError && error.statusCode === 401) {
        throw new InvalidCredentialsError('Mollie rejected the API key.');
      }
      throw error;
    }
  }

  async createCheckout(
    credentials: ProviderCredentials,
    input: CheckoutInput,
  ): Promise<CheckoutResult> {
    const payment = await this.client(credentials).payments.create({
      amount: {
        currency: input.currency,
        value: toDecimalString(input.amount, input.currency),
      },
      description: input.description,
      redirectUrl: input.returnUrl,
      webhookUrl: isPublicUrl(input.webhookUrl) ? input.webhookUrl : undefined,
      locale: mollieLocale(input.locale),
      metadata: { paymentId: input.reference },
      idempotencyKey: input.reference,
    });

    const checkoutUrl = payment.getCheckoutUrl();
    if (!checkoutUrl) {
      throw new Error(`Mollie payment ${payment.id} has no checkout URL`);
    }

    return {
      providerPaymentId: payment.id,
      checkoutUrl,
      expiresAt: payment.expiresAt ? new Date(payment.expiresAt) : null,
    };
  }

  async fetchPayment(
    credentials: ProviderCredentials,
    providerPaymentId: string,
  ): Promise<ProviderPaymentSnapshot> {
    const client = this.client(credentials);
    const payment = await client.payments.get(providerPaymentId);
    const refunds = await client.paymentRefunds.page({
      paymentId: providerPaymentId,
      limit: 250,
    });

    return {
      providerPaymentId: payment.id,
      status: PAYMENT_STATUS[payment.status],
      amount: fromDecimalString(payment.amount.value, payment.amount.currency),
      currency: payment.amount.currency,
      method: payment.method ?? null,
      paidAt: payment.paidAt ? new Date(payment.paidAt) : null,
      refunds: refunds.map((refund) => ({
        providerRefundId: refund.id,
        reference: metadataReference(refund.metadata, 'refundId'),
        status: REFUND_STATUS[refund.status],
        amount: fromDecimalString(refund.amount.value, refund.amount.currency),
        refundedAt:
          refund.status === MollieRefundStatus.refunded
            ? new Date(refund.createdAt)
            : null,
      })),
    };
  }

  parseWebhook(req: RawBodyRequest): Promise<string | null> {
    const body = req.body as Record<string, unknown> | undefined;
    const id = body?.id;

    if (typeof id !== 'string' || !/^tr_[A-Za-z0-9]+$/.test(id)) {
      return Promise.reject(new InvalidWebhookError('Missing payment id'));
    }

    return Promise.resolve(id);
  }

  async createRefund(
    credentials: ProviderCredentials,
    providerPaymentId: string,
    input: RefundInput,
  ): Promise<RefundResult> {
    const refund = await this.client(credentials).paymentRefunds.create({
      paymentId: providerPaymentId,
      amount: {
        currency: input.currency,
        value: toDecimalString(input.amount, input.currency),
      },
      description: input.reason ?? undefined,
      metadata: { refundId: input.reference },
      idempotencyKey: input.reference,
    });

    return {
      providerRefundId: refund.id,
      status: REFUND_STATUS[refund.status],
    };
  }
}
