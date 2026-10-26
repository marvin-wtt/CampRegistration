import type { AuditService } from '#app/audit/audit.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type {
  Event,
  Payment,
  PaymentRefund,
  Prisma,
} from '#generated/prisma/client.js';
import prisma from '../../../src/__mock__/client.js';
import { PaymentService } from '#app/payment/payment.service';
import type { PaymentAccountService } from '#app/paymentAccount/payment-account.service';
import type { SettingService } from '#app/setting/setting.service';
import type { PaymentProvider } from '#app/paymentAccount/providers/payment.provider';

const accountService = mock<PaymentAccountService>();
const settingService = mock<SettingService>();
const provider = mock<PaymentProvider>();
const audit = mock<AuditService>();

const service = new PaymentService(accountService, settingService, audit);
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
  payerName: null,
  registrationRef: null,
  settlement: null,
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

beforeEach(() => {
  vi.clearAllMocks();
  prisma.$transaction.mockImplementation(((fn: (tx: unknown) => unknown) =>
    fn(prisma)) as never);
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

  const refund = (
    amount: number,
    outsideApp = false,
    reduceAmountDue = false,
    reason: string | null = null,
  ) =>
    service.refund(
      event,
      'payment-1',
      {
        amount,
        reason,
        notifyParticipant: true,
        outsideApp,
        reduceAmountDue,
      },
      'user-1',
    );

  const owing = (amountDue: number) =>
    prisma.registration.findUniqueOrThrow.mockResolvedValue({
      id: 'registration-1',
      eventId: event.id,
      amountDue,
      amountDueAdjustedAt: null,
      amountDueNote: null,
    } as never);

  it('lowers what is owed by the refund when asked to', async () => {
    setup(buildPayment({ status: 'PAID', source: 'manual' }));
    owing(5000);

    await refund(1000, false, true, 'Arrives late');

    expect(prisma.registration.update).toHaveBeenCalledWith({
      where: { id: 'registration-1' },
      data: expect.objectContaining({
        amountDue: 4000,
        amountDueNote: 'Arrives late',
      }) as unknown,
    });
  });

  it('keeps what is owed unless asked to lower it', async () => {
    setup(buildPayment({ status: 'PAID', source: 'manual' }));

    await refund(1000);

    expect(prisma.registration.update).not.toHaveBeenCalled();
  });

  it('restores what was owed when the provider rejects the refund', async () => {
    setup(buildPayment({ status: 'PAID' }));
    owing(5000);
    provider.createRefund.mockRejectedValue(new Error('insufficient balance'));

    await expect(refund(1000, false, true)).rejects.toMatchObject({
      statusCode: 502,
    });
    expect(prisma.registration.update).toHaveBeenLastCalledWith({
      where: { id: 'registration-1' },
      data: { amountDue: 5000, amountDueAdjustedAt: null, amountDueNote: null },
    });
  });

  it('records an online refund given back outside the app at once', async () => {
    setup(buildPayment({ status: 'PAID' }));

    const result = await refund(1000, true);

    expect(accountService.resolveForOrganization).not.toHaveBeenCalled();
    expect(prisma.paymentRefund.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'REFUNDED' }) as unknown,
      }),
    );
    expect(result.completedNow).toBe(true);
  });

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
