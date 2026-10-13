import { beforeEach, describe, expect, it, vi } from 'vitest';
import Stripe from 'stripe';
import { StripeProvider } from '#app/payment/providers/stripe/stripe.provider';
import { MollieProvider } from '#app/payment/providers/mollie/mollie.provider';
import {
  InvalidCredentialsError,
  InvalidWebhookError,
  type RawBodyRequest,
} from '#app/payment/providers/payment.provider';

const molliePayments = { get: vi.fn(), create: vi.fn() };
const mollieRefunds = { page: vi.fn(), create: vi.fn() };

vi.mock('@mollie/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mollie/api-client')>();

  return {
    ...actual,
    default: () => ({
      payments: molliePayments,
      paymentRefunds: mollieRefunds,
      profiles: { getCurrent: vi.fn().mockResolvedValue({ name: 'Shop' }) },
    }),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('StripeProvider.parseWebhook', () => {
  const secret = 'whsec_test';
  const provider = new StripeProvider();
  const credentials = { apiKey: 'sk_test_x', webhookSecret: secret };

  const signedRequest = (payload: object, signWith = secret) => {
    const body = JSON.stringify(payload);
    const header = new Stripe('sk_test_x').webhooks.generateTestHeaderString({
      payload: body,
      secret: signWith,
    });

    return {
      headers: { 'stripe-signature': header },
      rawBody: Buffer.from(body),
    } as unknown as RawBodyRequest;
  };

  it('returns the session id of a signed checkout event', async () => {
    const req = signedRequest({
      id: 'evt_1',
      object: 'event',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_1', object: 'checkout.session' } },
    });

    await expect(provider.parseWebhook(req, credentials)).resolves.toBe(
      'cs_test_1',
    );
  });

  it('rejects a wrong signature', async () => {
    const req = signedRequest(
      {
        id: 'evt_1',
        object: 'event',
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_test_1' } },
      },
      'whsec_other',
    );

    await expect(
      provider.parseWebhook(req, credentials),
    ).rejects.toBeInstanceOf(InvalidWebhookError);
  });

  it('rejects unsigned requests', async () => {
    const req = { headers: {}, rawBody: Buffer.from('{}') } as RawBodyRequest;

    await expect(
      provider.parseWebhook(req, credentials),
    ).rejects.toBeInstanceOf(InvalidWebhookError);
  });

  it('ignores unrelated events', async () => {
    const req = signedRequest({
      id: 'evt_1',
      object: 'event',
      type: 'customer.created',
      data: { object: { id: 'cus_1' } },
    });

    await expect(provider.parseWebhook(req, credentials)).resolves.toBeNull();
  });

  it('refuses keys that are not secret keys', async () => {
    await expect(
      provider.connect({ apiKey: 'pk_test_1', webhookUrl: 'https://x' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});

describe('MollieProvider', () => {
  const provider = new MollieProvider();
  const credentials = { apiKey: 'test_abc' };

  it('maps a paid payment and its refunds', async () => {
    molliePayments.get.mockResolvedValue({
      id: 'tr_1',
      status: 'paid',
      amount: { currency: 'EUR', value: '50.00' },
      method: 'ideal',
      paidAt: '2026-01-01T10:00:00Z',
    });
    mollieRefunds.page.mockResolvedValue([
      {
        id: 're_1',
        status: 'refunded',
        amount: { currency: 'EUR', value: '10.50' },
        metadata: { refundId: 'refund-1' },
        createdAt: '2026-01-02T10:00:00Z',
      },
      {
        id: 're_2',
        status: 'queued',
        amount: { currency: 'EUR', value: '5.00' },
        metadata: null,
        createdAt: '2026-01-03T10:00:00Z',
      },
    ]);

    const snapshot = await provider.fetchPayment(credentials, 'tr_1');

    expect(snapshot).toMatchObject({
      status: 'PAID',
      amount: 5000,
      method: 'ideal',
      refunds: [
        {
          providerRefundId: 're_1',
          reference: 'refund-1',
          status: 'REFUNDED',
          amount: 1050,
        },
        { providerRefundId: 're_2', reference: null, status: 'PENDING' },
      ],
    });
  });

  it('maps authorized to pending', async () => {
    molliePayments.get.mockResolvedValue({
      id: 'tr_1',
      status: 'authorized',
      amount: { currency: 'EUR', value: '50.00' },
    });
    mollieRefunds.page.mockResolvedValue([]);

    await expect(
      provider.fetchPayment(credentials, 'tr_1'),
    ).resolves.toMatchObject({ status: 'PENDING', paidAt: null });
  });

  it('sends amounts as decimal strings and omits unreachable webhooks', async () => {
    molliePayments.create.mockResolvedValue({
      id: 'tr_1',
      expiresAt: null,
      getCheckoutUrl: () => 'https://mollie/checkout',
    });

    await provider.createCheckout(credentials, {
      amount: 1250,
      currency: 'EUR',
      description: 'Event',
      reference: 'payment-1',
      locale: 'de-DE',
      email: null,
      returnUrl: 'http://localhost:9000/return',
      webhookUrl: 'http://localhost:8000/api/v1/webhooks/payments/mollie/a',
    });

    expect(molliePayments.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: { currency: 'EUR', value: '12.50' },
        locale: 'de_DE',
        webhookUrl: undefined,
        metadata: { paymentId: 'payment-1' },
      }),
    );
  });

  it('only accepts Mollie payment ids in webhooks', async () => {
    await expect(
      provider.parseWebhook({ body: { id: 'tr_abc123' } } as RawBodyRequest),
    ).resolves.toBe('tr_abc123');
    await expect(
      provider.parseWebhook({ body: { id: '../etc' } } as RawBodyRequest),
    ).rejects.toBeInstanceOf(InvalidWebhookError);
  });

  it('refuses keys that are not Mollie API keys', async () => {
    await expect(
      provider.connect({ apiKey: 'access_x', webhookUrl: 'https://x' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
