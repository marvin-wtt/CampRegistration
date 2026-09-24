import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type {
  Event,
  Payment,
  PaymentRefund,
  Prisma,
} from '#generated/prisma/client.js';
import prisma from '../../../src/__mock__/client.js';
import {
  isPaymentStatusAdvance,
  isRefundStatusAdvance,
  PaymentService,
} from '#app/payment/payment.service';
import type { PaymentAccountService } from '#app/payment/payment-account.service';
import type { SettingService } from '#app/setting/setting.service';
import type {
  PaymentProvider,
  ProviderPaymentSnapshot,
} from '#app/payment/providers/payment.provider';

const accountService = mock<PaymentAccountService>();
const settingService = mock<SettingService>();
const provider = mock<PaymentProvider>();

const service = new PaymentService(accountService, settingService);
(service as unknown as { prisma: typeof prisma }).prisma = prisma;

const event = {
  id: 'event-1',
  organizationId: 'org-1',
  currency: 'EUR',
} as Event;

const buildPayment = (overrides: Partial<Payment> = {}): Payment => ({
  id: 'payment-1',
  registrationId: 'registration-1',
  eventId: event.id,
  source: 'stripe',
  providerPaymentId: 'cs_1',
  status: 'OPEN',
  amount: 5000,
  currency: 'EUR',
  method: null,
  checkoutUrl: 'https://checkout',
  expiresAt: null,
  paidAt: null,
  note: null,
  createdById: null,
  createdAt: new Date(),
  updatedAt: null,
  ...overrides,
});

const buildRefund = (
  overrides: Partial<PaymentRefund> = {},
): PaymentRefund => ({
  id: 'refund-1',
  paymentId: 'payment-1',
  providerRefundId: null,
  status: 'PENDING',
  amount: 1000,
  reason: null,
  notifyParticipant: true,
  createdById: 'user-1',
  refundedAt: null,
  createdAt: new Date(),
  updatedAt: null,
  ...overrides,
});

const snapshot = (
  overrides: Partial<ProviderPaymentSnapshot> = {},
): ProviderPaymentSnapshot => ({
  providerPaymentId: 'cs_1',
  status: 'OPEN',
  amount: 5000,
  currency: 'EUR',
  method: null,
  paidAt: null,
  refunds: [],
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  prisma.$transaction.mockImplementation(((fn: (tx: unknown) => unknown) =>
    fn(prisma)) as never);
});

describe('status transitions', () => {
  it('only moves payments forward', () => {
    expect(isPaymentStatusAdvance('OPEN', 'PENDING')).toBe(true);
    expect(isPaymentStatusAdvance('PENDING', 'PAID')).toBe(true);
    expect(isPaymentStatusAdvance('PENDING', 'OPEN')).toBe(false);
    expect(isPaymentStatusAdvance('PAID', 'FAILED')).toBe(false);
    expect(isPaymentStatusAdvance('FAILED', 'EXPIRED')).toBe(false);
    expect(isPaymentStatusAdvance('OPEN', 'OPEN')).toBe(false);
  });

  it('lets money that arrived late still count', () => {
    expect(isPaymentStatusAdvance('EXPIRED', 'PAID')).toBe(true);
  });

  it('only settles pending refunds', () => {
    expect(isRefundStatusAdvance('PENDING', 'REFUNDED')).toBe(true);
    expect(isRefundStatusAdvance('REFUNDED', 'FAILED')).toBe(false);
    expect(isRefundStatusAdvance('PENDING', 'PENDING')).toBe(false);
  });
});

describe('PaymentService.applySnapshot', () => {
  const loadCurrent = (payment: Payment, refunds: PaymentRefund[] = []) => {
    prisma.payment.findUniqueOrThrow.mockResolvedValue({
      ...payment,
      refunds,
      event,
      registration: { id: 'registration-1' },
    } as never);
  };

  it('records a payment becoming paid', async () => {
    const paidAt = new Date('2026-01-01');
    loadCurrent(buildPayment());
    prisma.payment.update.mockResolvedValue(
      buildPayment({ status: 'PAID', paidAt }),
    );

    const outcome = await service.applySnapshot(
      'payment-1',
      snapshot({ status: 'PAID', paidAt, method: 'card' }),
    );

    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: { status: 'PAID', method: 'card', paidAt },
    });
    expect(outcome).toMatchObject({ statusChange: 'PAID', changed: true });
  });

  it('is a no-op for a replayed webhook', async () => {
    loadCurrent(buildPayment({ status: 'PAID' }));

    const outcome = await service.applySnapshot(
      'payment-1',
      snapshot({ status: 'PAID' }),
    );

    expect(prisma.payment.update).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ statusChange: null, changed: false });
  });

  it('never regresses on an out-of-order webhook', async () => {
    loadCurrent(buildPayment({ status: 'PAID' }));

    const outcome = await service.applySnapshot(
      'payment-1',
      snapshot({ status: 'PENDING' }),
    );

    expect(prisma.payment.update).not.toHaveBeenCalled();
    expect(outcome.statusChange).toBeNull();
  });

  it('inserts a refund made in the provider dashboard', async () => {
    loadCurrent(buildPayment({ status: 'PAID' }));
    const created = buildRefund({
      providerRefundId: 're_1',
      status: 'REFUNDED',
      createdById: null,
    });
    prisma.paymentRefund.create.mockResolvedValue(created);

    const outcome = await service.applySnapshot(
      'payment-1',
      snapshot({
        status: 'PAID',
        refunds: [
          {
            providerRefundId: 're_1',
            reference: null,
            status: 'REFUNDED',
            amount: 1000,
            refundedAt: new Date(),
          },
        ],
      }),
    );

    expect(prisma.paymentRefund.create).toHaveBeenCalled();
    expect(outcome.completedRefunds).toEqual([created]);
  });

  it('matches its own refund by reference instead of duplicating it', async () => {
    const own = buildRefund();
    loadCurrent(buildPayment({ status: 'PAID' }), [own]);
    const settled = buildRefund({
      providerRefundId: 're_1',
      status: 'REFUNDED',
    });
    prisma.paymentRefund.update.mockResolvedValue(settled);

    const outcome = await service.applySnapshot(
      'payment-1',
      snapshot({
        status: 'PAID',
        refunds: [
          {
            providerRefundId: 're_1',
            reference: own.id,
            status: 'REFUNDED',
            amount: 1000,
            refundedAt: new Date(),
          },
        ],
      }),
    );

    expect(prisma.paymentRefund.create).not.toHaveBeenCalled();
    expect(prisma.paymentRefund.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: own.id } }),
    );
    expect(outcome.completedRefunds).toEqual([settled]);
  });

  it('reports a completed refund only once', async () => {
    loadCurrent(buildPayment({ status: 'PAID' }), [
      buildRefund({ providerRefundId: 're_1', status: 'REFUNDED' }),
    ]);

    const outcome = await service.applySnapshot(
      'payment-1',
      snapshot({
        status: 'PAID',
        refunds: [
          {
            providerRefundId: 're_1',
            reference: 'refund-1',
            status: 'REFUNDED',
            amount: 1000,
            refundedAt: new Date(),
          },
        ],
      }),
    );

    expect(prisma.paymentRefund.update).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ completedRefunds: [], changed: false });
  });
});

describe('PaymentService.refund', () => {
  const resolved = {
    account: { provider: 'stripe' },
    provider,
    credentials: { apiKey: 'sk_test' },
  };

  const setup = (payment: Payment, refunds: PaymentRefund[] = []) => {
    prisma.payment.findUniqueOrThrow.mockResolvedValue({
      ...payment,
      refunds,
    } as never);
    accountService.resolveForOrganization.mockResolvedValue(resolved as never);
    prisma.paymentRefund.create.mockImplementation(((args: {
      data: Prisma.PaymentRefundUncheckedCreateInput;
    }) =>
      Promise.resolve(
        buildRefund({
          status: args.data.status,
          amount: args.data.amount,
        }),
      )) as never);
    prisma.paymentRefund.findUniqueOrThrow.mockResolvedValue(buildRefund());
  };

  const refund = (amount: number) =>
    service.refund(
      event,
      'payment-1',
      { amount, reason: null, notifyParticipant: true },
      'user-1',
    );

  it('rejects refunding more than is left', async () => {
    setup(buildPayment({ status: 'PAID' }), [
      buildRefund({ amount: 4000, status: 'REFUNDED' }),
    ]);

    await expect(refund(1500)).rejects.toMatchObject({ statusCode: 422 });
    expect(prisma.paymentRefund.create).not.toHaveBeenCalled();
  });

  it('only refunds paid payments', async () => {
    setup(buildPayment({ status: 'OPEN' }));

    await expect(refund(100)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('refuses when the payment’s provider account is gone', async () => {
    setup(buildPayment({ status: 'PAID' }));
    accountService.resolveForOrganization.mockResolvedValue(null);

    await expect(refund(100)).rejects.toMatchObject({
      code: 'PAYMENT_ACCOUNT_CHANGED',
    });
  });

  it('calls the provider with the refund row as reference', async () => {
    setup(buildPayment({ status: 'PAID' }));
    provider.createRefund.mockResolvedValue({
      providerRefundId: 're_1',
      status: 'PENDING',
    });

    const result = await refund(1000);

    expect(provider.createRefund).toHaveBeenCalledWith(
      resolved.credentials,
      'cs_1',
      {
        amount: 1000,
        currency: 'EUR',
        reason: null,
        reference: 'refund-1',
      },
    );
    expect(prisma.paymentRefund.update).toHaveBeenCalledWith({
      where: { id: 'refund-1' },
      data: { providerRefundId: 're_1' },
    });
    expect(result.completedNow).toBe(false);
  });

  it('completes immediately when the provider settles synchronously', async () => {
    setup(buildPayment({ status: 'PAID' }));
    provider.createRefund.mockResolvedValue({
      providerRefundId: 're_1',
      status: 'REFUNDED',
    });
    prisma.paymentRefund.updateMany.mockResolvedValue({ count: 1 });

    const result = await refund(1000);

    expect(result.completedNow).toBe(true);
  });

  it('marks the refund failed when the provider rejects it', async () => {
    setup(buildPayment({ status: 'PAID' }));
    provider.createRefund.mockRejectedValue(new Error('insufficient balance'));

    await expect(refund(1000)).rejects.toMatchObject({ statusCode: 502 });
    expect(prisma.paymentRefund.updateMany).toHaveBeenCalledWith({
      where: { id: 'refund-1', status: 'PENDING' },
      data: { status: 'FAILED' },
    });
  });

  it('records manual refunds as done without a provider', async () => {
    setup(
      buildPayment({
        status: 'PAID',
        source: 'manual',
        providerPaymentId: null,
      }),
    );

    const result = await refund(1000);

    expect(provider.createRefund).not.toHaveBeenCalled();
    expect(prisma.paymentRefund.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'REFUNDED' }) as unknown,
      }),
    );
    expect(result.completedNow).toBe(true);
  });
});
