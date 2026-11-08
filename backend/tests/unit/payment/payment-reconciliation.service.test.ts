import type { AuditService } from '#app/audit/audit.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type {
  Event,
  Payment,
  PaymentRefund,
} from '#generated/prisma/client.js';
import prisma from '../../../src/__mock__/client.js';
import { buildPayment, buildRefund } from './fixtures.js';
import {
  isChargebackStatusAdvance,
  isPaymentStatusAdvance,
  isRefundStatusAdvance,
  PaymentReconciliationService,
} from '#app/payment/payment-reconciliation.service';
import type { PaymentAccountService } from '#app/paymentAccount/payment-account.service';
import type { PaymentService } from '#app/payment/payment.service';
import type { PaymentRefundService } from '#app/payment/payment-refund.service';
import type { ProviderPaymentSnapshot } from '#app/paymentAccount/providers/payment.provider';

const accountService = mock<PaymentAccountService>();
const audit = mock<AuditService>();
const paymentService = mock<PaymentService>();
const refundService = mock<PaymentRefundService>();

const service = new PaymentReconciliationService(
  accountService,
  audit,
  paymentService,
  refundService,
);
(service as unknown as { prisma: typeof prisma }).prisma = prisma;

const event = {
  id: 'event-1',
  organizationId: 'org-1',
  currency: 'EUR',
} as Event;

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
  chargebacks: [],
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

  it('lets a lost chargeback still be reversed', () => {
    expect(isChargebackStatusAdvance('PENDING', 'REFUNDED')).toBe(true);
    expect(isChargebackStatusAdvance('REFUNDED', 'CANCELED')).toBe(true);
    expect(isChargebackStatusAdvance('CANCELED', 'REFUNDED')).toBe(false);
  });
});

describe('PaymentReconciliationService.applySnapshot', () => {
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

    expect(prisma.paymentRefund.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ notifyParticipant: false }),
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'payment_refunded', actorId: null }),
    );
    expect(outcome.completedRefunds).toEqual([created]);
    // Whether it is still owed is the manager's call: no reminders meanwhile.
    expect(paymentService.holdPayments).toHaveBeenCalledWith('registration-1');
  });

  it('gives back the amount due when a refund fails later', async () => {
    const own = buildRefund({
      providerRefundId: 're_1',
      amountDueReduction: 1000,
    });
    loadCurrent(buildPayment({ status: 'PAID' }), [own]);
    const failed = buildRefund({ ...own, status: 'FAILED' });
    prisma.paymentRefund.update.mockResolvedValue(failed);

    const outcome = await service.applySnapshot(
      'payment-1',
      snapshot({
        status: 'PAID',
        refunds: [
          {
            providerRefundId: 're_1',
            reference: own.id,
            status: 'FAILED',
            amount: 1000,
            refundedAt: null,
          },
        ],
      }),
    );

    expect(refundService.restoreAmountDue).toHaveBeenCalledWith(failed);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'payment_refund_failed' }),
    );
    expect(outcome.completedRefunds).toEqual([]);
  });

  it('books a chargeback without notifying anyone', async () => {
    loadCurrent(buildPayment({ status: 'PAID' }));

    const outcome = await service.applySnapshot(
      'payment-1',
      snapshot({
        status: 'PAID',
        chargebacks: [
          {
            providerChargebackId: 'dp_1',
            status: 'PENDING',
            amount: 5000,
            createdAt: new Date(),
          },
        ],
      }),
    );

    expect(prisma.paymentRefund.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        kind: 'CHARGEBACK',
        providerRefundId: 'dp_1',
        status: 'PENDING',
        notifyParticipant: false,
      }),
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'payment_charged_back' }),
    );
    expect(outcome).toMatchObject({ changed: true, completedRefunds: [] });
    expect(paymentService.holdPayments).toHaveBeenCalledWith('registration-1');
  });

  it('records a won chargeback as reversed', async () => {
    const chargeback = buildRefund({
      kind: 'CHARGEBACK',
      providerRefundId: 'dp_1',
      status: 'REFUNDED',
      amount: 5000,
    });
    loadCurrent(buildPayment({ status: 'PAID' }), [chargeback]);
    prisma.paymentRefund.count.mockResolvedValue(0);

    await service.applySnapshot(
      'payment-1',
      snapshot({
        status: 'PAID',
        chargebacks: [
          {
            providerChargebackId: 'dp_1',
            status: 'CANCELED',
            amount: 5000,
            createdAt: new Date(),
          },
        ],
      }),
    );

    expect(prisma.paymentRefund.update).toHaveBeenCalledWith({
      where: { id: chargeback.id },
      data: { status: 'CANCELED', refundedAt: null },
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'payment_chargeback_reversed' }),
    );
    expect(paymentService.releaseHold).toHaveBeenCalledWith('registration-1');
  });

  it('keeps the hold while another chargeback still counts', async () => {
    const chargeback = buildRefund({
      kind: 'CHARGEBACK',
      providerRefundId: 'dp_1',
      status: 'PENDING',
    });
    loadCurrent(buildPayment({ status: 'PAID' }), [chargeback]);
    prisma.paymentRefund.count.mockResolvedValue(1);

    await service.applySnapshot(
      'payment-1',
      snapshot({
        status: 'PAID',
        chargebacks: [
          {
            providerChargebackId: 'dp_1',
            status: 'CANCELED',
            amount: 1000,
            createdAt: new Date(),
          },
        ],
      }),
    );

    expect(paymentService.releaseHold).not.toHaveBeenCalled();
  });

  it('lifts the hold when a dashboard refund fails', async () => {
    const dashboard = buildRefund({
      providerRefundId: 're_dash',
      createdById: null,
      notifyParticipant: false,
    });
    loadCurrent(buildPayment({ status: 'PAID' }), [dashboard]);
    prisma.paymentRefund.update.mockResolvedValue({
      ...dashboard,
      status: 'FAILED',
    });
    prisma.paymentRefund.count.mockResolvedValue(0);

    await service.applySnapshot(
      'payment-1',
      snapshot({
        status: 'PAID',
        refunds: [
          {
            providerRefundId: 're_dash',
            reference: null,
            status: 'FAILED',
            amount: 1000,
            refundedAt: null,
          },
        ],
      }),
    );

    expect(paymentService.releaseHold).toHaveBeenCalledWith('registration-1');
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

describe('PaymentReconciliationService.reconcileLatestOpen', () => {
  it('asks the provider at most once per interval', async () => {
    prisma.payment.findFirst.mockResolvedValue(
      buildPayment({ id: 'payment-throttled', providerPaymentId: 'cs_t' }),
    );
    prisma.payment.findUnique.mockResolvedValue(null);

    await service.reconcileLatestOpen('registration-1');
    await service.reconcileLatestOpen('registration-1');

    expect(prisma.payment.findUnique).toHaveBeenCalledTimes(1);
  });
});
