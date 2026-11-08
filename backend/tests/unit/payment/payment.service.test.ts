import type { AuditService } from '#app/audit/audit.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Registration } from '#generated/prisma/client.js';
import prisma from '../../../src/__mock__/client.js';
import { buildPayment } from './fixtures.js';
import {
  type EventWithOrganization,
  PaymentService,
} from '#app/payment/payment.service';
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
  startAt: new Date('2020-01-01T00:00:00Z'),
  timezone: 'Europe/Berlin',
  organization: { verificationStatus: 'VERIFIED' },
} as EventWithOrganization;

beforeEach(() => {
  vi.clearAllMocks();
  prisma.$transaction.mockImplementation(((fn: (tx: unknown) => unknown) =>
    fn(prisma)) as never);
});

describe('PaymentService.closeStaleCheckouts', () => {
  const registration = { id: 'registration-1', amountDue: 5000 };

  beforeEach(() => {
    accountService.resolveForPayment.mockResolvedValue({
      account: { provider: 'stripe' },
      provider,
      credentials: { apiKey: 'sk_test' },
    } as never);
  });

  it('cancels open checkouts worth more than is outstanding', async () => {
    // First the balance (2000 paid of 5000), then the open checkouts.
    prisma.payment.findMany
      .mockResolvedValueOnce([
        { status: 'PAID', amount: 2000, refunds: [] },
      ] as never)
      .mockResolvedValueOnce([buildPayment({ id: 'payment-2' })]);

    await service.closeStaleCheckouts(event, registration);

    expect(prisma.payment.findMany).toHaveBeenLastCalledWith({
      where: expect.objectContaining({
        status: 'OPEN',
        amount: { gt: 3000 },
      }) as unknown,
    });
    expect(provider.cancelCheckout).toHaveBeenCalledWith(
      { apiKey: 'sk_test' },
      'cs_1',
    );
    expect(prisma.payment.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['payment-2'] }, status: 'OPEN' },
      data: { checkoutUrl: null },
    });
  });

  it('withdraws the checkout even when the provider refuses', async () => {
    prisma.payment.findMany.mockResolvedValueOnce([buildPayment()]);
    provider.cancelCheckout.mockRejectedValue(new Error('not cancelable'));

    await expect(
      service.closeStaleCheckouts(event, registration, 0),
    ).resolves.toBeUndefined();
    expect(prisma.payment.updateMany).toHaveBeenCalledOnce();
  });

  it('cancels through the account the checkout was opened with', async () => {
    const opened = buildPayment({ paymentAccountId: 'account-retired' });
    prisma.payment.findMany.mockResolvedValueOnce([opened]);

    await service.closeStaleCheckouts(event, registration, 0);

    expect(accountService.resolveForPayment).toHaveBeenCalledWith(opened);
    expect(accountService.resolveForOrganization).not.toHaveBeenCalled();
    expect(provider.cancelCheckout).toHaveBeenCalled();
  });
});

describe('PaymentService.anonymizeExpiredPayers', () => {
  it('counts the retention period from the end of the year', async () => {
    prisma.payment.updateMany.mockResolvedValue({ count: 0 });

    await service.anonymizeExpiredPayers(new Date('2037-06-15T00:00:00Z'));

    expect(prisma.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: { lt: new Date('2027-01-01T00:00:00Z') },
          refunds: {
            none: { createdAt: { gte: new Date('2027-01-01T00:00:00Z') } },
          },
        }) as unknown,
      }),
    );
  });
});

describe('PaymentService.releaseEventLedger', () => {
  it('refuses while paid payments must still be kept', async () => {
    prisma.payment.count.mockResolvedValue(1);

    await expect(service.releaseEventLedger(event.id)).rejects.toMatchObject({
      code: 'EVENT_HAS_PAYMENTS',
    });
    expect(prisma.payment.deleteMany).not.toHaveBeenCalled();
  });

  it('closes the open checkouts it removes', async () => {
    prisma.payment.count.mockResolvedValue(0);
    accountService.resolveForPayment.mockResolvedValue({
      account: { provider: 'stripe' },
      provider,
      credentials: { apiKey: 'sk_test' },
    } as never);
    prisma.payment.findMany.mockResolvedValue([buildPayment()]);
    prisma.payment.updateMany.mockResolvedValue({ count: 1 });

    await service.releaseEventLedger(event.id);

    expect(provider.cancelCheckout).toHaveBeenCalledWith(
      { apiKey: 'sk_test' },
      'cs_1',
    );
    expect(prisma.payment.deleteMany).toHaveBeenCalled();
  });

  it('removes the ledger once the retention period has passed', async () => {
    prisma.payment.count.mockResolvedValue(0);
    prisma.payment.findMany.mockResolvedValue([]);

    await service.releaseEventLedger(event.id);

    expect(prisma.paymentRefund.deleteMany).toHaveBeenCalledWith({
      where: { payment: { eventId: event.id } },
    });
    expect(prisma.payment.deleteMany).toHaveBeenCalledWith({
      where: { eventId: event.id },
    });
  });
});

describe('PaymentService.collectionBlocker', () => {
  const settings = {
    enabled: true,
    timing: 'ACCEPTANCE',
    requestDate: null,
    requestDaysBeforeStart: null,
    reminderAfterDays: null,
  } as const;

  it('names the first thing that stops collecting', () => {
    const blocker = (
      collection: Partial<Parameters<typeof service.collectionBlocker>[0]>,
    ) =>
      service.collectionBlocker(
        {
          settings,
          organizationVerified: true,
          accountConnected: true,
          ...collection,
        },
        event,
      );

    expect(blocker({})).toBeNull();
    expect(blocker({ settings: { ...settings, enabled: false } })).toBe(
      'disabled',
    );
    expect(
      blocker({ organizationVerified: false, accountConnected: false }),
    ).toBe('unverified');
    expect(blocker({ accountConnected: false })).toBe('no_account');
  });
});

describe('PaymentService.startCheckout', () => {
  const registration = {
    id: 'registration-1',
    eventId: event.id,
    status: 'ACCEPTED',
    amountDue: 5000,
    paymentHoldAt: null,
    firstName: 'Ada',
    lastName: 'Lovelace',
    locale: 'en-US',
    emails: [],
  } as unknown as Registration;

  beforeEach(() => {
    settingService.getSetting.mockResolvedValue({
      data: { enabled: true, timing: 'ACCEPTANCE' },
    } as never);
    accountService.getByOrganization.mockResolvedValue({} as never);
    accountService.resolveForOrganization.mockResolvedValue({
      account: { provider: 'stripe', id: 'account-1' },
      provider,
      credentials: { apiKey: 'sk_test' },
    } as never);
    prisma.$queryRaw.mockResolvedValue([] as never);
    prisma.payment.findMany.mockResolvedValue([]);
  });

  it('charges what is owed by the row read under the lock', async () => {
    // A manager lowered the amount after the request loaded the registration.
    prisma.registration.findUniqueOrThrow.mockResolvedValue({
      ...registration,
      amountDue: 3000,
    });
    prisma.payment.findFirst.mockResolvedValue(
      buildPayment({ amount: 3000, checkoutUrl: 'https://reuse' }),
    );

    // The bound model still says 5000.
    const result = await service.startCheckout(event, registration);

    expect(prisma.payment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ amount: 3000 }) as unknown,
      }),
    );
    expect(result).toMatchObject({
      checkoutUrl: 'https://reuse',
      created: false,
    });
  });

  it('refuses a registration on hold', async () => {
    prisma.registration.findUniqueOrThrow.mockResolvedValue({
      ...registration,
      paymentHoldAt: new Date(),
    });

    await expect(
      service.startCheckout(event, registration),
    ).rejects.toMatchObject({ code: 'PAYMENT_ON_HOLD' });
    expect(provider.createCheckout).not.toHaveBeenCalled();
  });
});

describe('PaymentService.settleForDeletion', () => {
  it('closes open checkouts, so nothing is paid after the deletion', async () => {
    accountService.resolveForPayment.mockResolvedValue({
      account: { provider: 'stripe' },
      provider,
      credentials: { apiKey: 'sk_test' },
    } as never);
    prisma.payment.findMany
      // Nothing paid, so nothing to settle…
      .mockResolvedValueOnce([])
      // …but a checkout is still open.
      .mockResolvedValueOnce([buildPayment()]);
    prisma.payment.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.settleForDeletion(
        event,
        { id: 'registration-1', amountDue: 5000 } as Registration,
        undefined,
        { userId: null, maySettle: false },
      ),
    ).resolves.toBeNull();
    expect(provider.cancelCheckout).toHaveBeenCalledWith(
      { apiKey: 'sk_test' },
      'cs_1',
    );
  });
});

describe('PaymentService.settleForDeletion permissions', () => {
  it('lets only someone allowed to refund settle money held', async () => {
    prisma.payment.findMany.mockResolvedValueOnce([
      { ...buildPayment({ status: 'PAID' }), refunds: [] },
    ] as never);

    await expect(
      service.settleForDeletion(
        event,
        { id: 'registration-1', amountDue: 5000 } as Registration,
        'settled_outside',
        { userId: 'user-1', maySettle: false },
      ),
    ).rejects.toMatchObject({ code: 'PAYMENT_SETTLEMENT_FORBIDDEN' });
    expect(prisma.paymentRefund.create).not.toHaveBeenCalled();
  });
});

describe('PaymentService.setAmountDue', () => {
  it('lifts a hold: a manager decided what is owed', async () => {
    prisma.registration.update.mockResolvedValue({
      id: 'registration-1',
      eventId: event.id,
      amountDue: 0,
    } as never);
    prisma.payment.findMany.mockResolvedValue([]);

    await service.setAmountDue(
      event,
      { id: 'registration-1' },
      { amountDue: 0, adjusted: true, note: null },
    );

    expect(prisma.registration.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paymentHoldAt: null }) as unknown,
      }),
    );
  });
});
