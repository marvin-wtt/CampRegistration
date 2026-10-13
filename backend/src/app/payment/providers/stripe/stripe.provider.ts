import Stripe from 'stripe';
import type {
  PaymentStatus,
  RefundStatus,
} from '@camp-registration/common/entities';
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
  type ProviderCredentials,
  type ProviderPaymentSnapshot,
  type RawBodyRequest,
  type RefundInput,
  type RefundResult,
} from '../payment.provider.js';

const WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
  'charge.refunded',
  'charge.refund.updated',
  'refund.updated',
  'refund.failed',
];

const REFUND_STATUS: Record<string, RefundStatus> = {
  pending: 'PENDING',
  requires_action: 'PENDING',
  succeeded: 'REFUNDED',
  failed: 'FAILED',
  canceled: 'CANCELED',
};

function refundStatus(status: string | null): RefundStatus {
  return REFUND_STATUS[status ?? 'pending'] ?? 'PENDING';
}

// Stripe Checkout locales our own locales map onto.
const CHECKOUT_LOCALES = new Set(['cs', 'de', 'en', 'fr', 'pl']);

function checkoutLocale(
  locale: string,
): Stripe.Checkout.SessionCreateParams.Locale {
  const language = locale.split('-')[0];

  return CHECKOUT_LOCALES.has(language) ? language : 'auto';
}

function idOf(value: string | { id: string } | null): string | null {
  if (value === null) {
    return null;
  }

  return typeof value === 'string' ? value : value.id;
}

function sessionStatus(session: Stripe.Checkout.Session): PaymentStatus {
  if (session.payment_status === 'paid') {
    return 'PAID';
  }
  if (session.status === 'expired') {
    return 'EXPIRED';
  }
  if (session.status === 'open') {
    return 'OPEN';
  }

  // Completed but unpaid: a delayed method (SEPA debit, ...) is in flight,
  // or it already failed and the intent went back to collecting a method.
  const intent = session.payment_intent;
  if (intent && typeof intent !== 'string') {
    if (intent.status === 'canceled') {
      return 'CANCELED';
    }
    if (intent.status === 'requires_payment_method') {
      return 'FAILED';
    }
  }

  return 'PENDING';
}

/**
 * Stripe Checkout Sessions. `providerPaymentId` is the session id; the
 * payment intent behind it is resolved when needed. Webhooks are signed per
 * endpoint: `connect` registers one endpoint per account and keeps its
 * signing secret with the (encrypted) credentials.
 */
export class StripeProvider implements PaymentProvider {
  readonly name = 'stripe' as const;

  private client(credentials: ProviderCredentials): Stripe {
    return new Stripe(credentials.apiKey);
  }

  async connect({ apiKey, webhookUrl }: ConnectInput): Promise<ConnectResult> {
    const mode = /^(sk|rk)_live_/.test(apiKey)
      ? 'live'
      : /^(sk|rk)_test_/.test(apiKey)
        ? 'test'
        : null;
    if (!mode) {
      throw new InvalidCredentialsError(
        'A Stripe secret key starts with "sk_live_" or "sk_test_".',
      );
    }

    const stripe = new Stripe(apiKey);

    let account: Stripe.Account;
    try {
      account = await stripe.accounts.retrieveCurrent();
    } catch (error) {
      if (error instanceof Stripe.errors.StripeAuthenticationError) {
        throw new InvalidCredentialsError('Stripe rejected the API key.');
      }
      throw error;
    }

    const credentials: ProviderCredentials = { apiKey };
    try {
      const endpoint = await stripe.webhookEndpoints.create({
        url: webhookUrl,
        enabled_events: WEBHOOK_EVENTS,
        description: 'Event registrations',
      });
      if (endpoint.secret) {
        credentials.webhookEndpointId = endpoint.id;
        credentials.webhookSecret = endpoint.secret;
      }
    } catch (error) {
      // Stripe refuses URLs it cannot reach, such as a local dev server.
      // Payments still reconcile when the participant returns from checkout;
      // only the push notifications are missing.
      logger.warn(
        `Could not register Stripe webhook endpoint ${webhookUrl}: ${describeError(error)}`,
      );
    }

    return {
      credentials,
      mode,
      displayName:
        account.settings?.dashboard.display_name ??
        account.business_profile?.name ??
        null,
    };
  }

  async disconnect(credentials: ProviderCredentials): Promise<void> {
    if (credentials.webhookEndpointId) {
      await this.client(credentials).webhookEndpoints.del(
        credentials.webhookEndpointId,
      );
    }
  }

  async createCheckout(
    credentials: ProviderCredentials,
    input: CheckoutInput,
  ): Promise<CheckoutResult> {
    const session = await this.client(credentials).checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: input.currency.toLowerCase(),
              unit_amount: input.amount,
              product_data: { name: input.description },
            },
          },
        ],
        client_reference_id: input.reference,
        customer_email: input.email ?? undefined,
        success_url: input.returnUrl,
        cancel_url: input.returnUrl,
        locale: checkoutLocale(input.locale),
        metadata: { paymentId: input.reference },
        payment_intent_data: { metadata: { paymentId: input.reference } },
      },
      { idempotencyKey: input.reference },
    );

    if (!session.url) {
      throw new Error(`Stripe session ${session.id} has no checkout URL`);
    }

    return {
      providerPaymentId: session.id,
      checkoutUrl: session.url,
      expiresAt: new Date(session.expires_at * 1000),
    };
  }

  async fetchPayment(
    credentials: ProviderCredentials,
    providerPaymentId: string,
  ): Promise<ProviderPaymentSnapshot> {
    const stripe = this.client(credentials);
    const session = await stripe.checkout.sessions.retrieve(providerPaymentId, {
      expand: ['payment_intent', 'payment_intent.latest_charge'],
    });

    const intent =
      session.payment_intent && typeof session.payment_intent !== 'string'
        ? session.payment_intent
        : null;
    const charge =
      intent?.latest_charge && typeof intent.latest_charge !== 'string'
        ? intent.latest_charge
        : null;

    const refunds = intent
      ? (await stripe.refunds.list({ payment_intent: intent.id, limit: 100 }))
          .data
      : [];

    const status = sessionStatus(session);

    return {
      providerPaymentId: session.id,
      status,
      amount: session.amount_total ?? 0,
      currency: (session.currency ?? '').toUpperCase(),
      method: charge?.payment_method_details?.type ?? null,
      paidAt:
        status === 'PAID'
          ? new Date((charge?.created ?? session.created) * 1000)
          : null,
      refunds: refunds.map((refund) => ({
        providerRefundId: refund.id,
        reference: refund.metadata?.refundId ?? null,
        status: refundStatus(refund.status),
        amount: refund.amount,
        refundedAt:
          refund.status === 'succeeded'
            ? new Date(refund.created * 1000)
            : null,
      })),
    };
  }

  async parseWebhook(
    req: RawBodyRequest,
    credentials: ProviderCredentials,
  ): Promise<string | null> {
    const signature = req.headers['stripe-signature'];
    if (
      !credentials.webhookSecret ||
      !req.rawBody ||
      typeof signature !== 'string'
    ) {
      throw new InvalidWebhookError('Unsigned Stripe webhook');
    }

    let event: Stripe.Event;
    try {
      event = this.client(credentials).webhooks.constructEvent(
        req.rawBody,
        signature,
        credentials.webhookSecret,
      );
    } catch {
      throw new InvalidWebhookError('Invalid Stripe webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired':
        return event.data.object.id;
      case 'charge.refunded':
      case 'charge.refund.updated':
      case 'refund.updated':
      case 'refund.failed':
        return this.sessionForIntent(
          credentials,
          idOf(event.data.object.payment_intent),
        );
      default:
        return null;
    }
  }

  async createRefund(
    credentials: ProviderCredentials,
    providerPaymentId: string,
    input: RefundInput,
  ): Promise<RefundResult> {
    const stripe = this.client(credentials);
    const session = await stripe.checkout.sessions.retrieve(providerPaymentId);
    const paymentIntent = idOf(session.payment_intent);
    if (!paymentIntent) {
      throw new Error(`Stripe session ${providerPaymentId} was never paid`);
    }

    const refund = await stripe.refunds.create(
      {
        payment_intent: paymentIntent,
        amount: input.amount,
        metadata: {
          refundId: input.reference,
          ...(input.reason ? { reason: input.reason.slice(0, 500) } : {}),
        },
      },
      { idempotencyKey: input.reference },
    );

    return {
      providerRefundId: refund.id,
      status: refundStatus(refund.status),
    };
  }

  private async sessionForIntent(
    credentials: ProviderCredentials,
    paymentIntent: string | null,
  ): Promise<string | null> {
    if (!paymentIntent) {
      return null;
    }

    const sessions = await this.client(credentials).checkout.sessions.list({
      payment_intent: paymentIntent,
      limit: 1,
    });

    return sessions.data[0]?.id ?? null;
  }
}
