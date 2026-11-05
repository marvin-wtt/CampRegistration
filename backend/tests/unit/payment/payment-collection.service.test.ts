import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Registration } from '#generated/prisma/client.js';
import { PaymentCollectionService } from '#app/payment/payment-collection.service';
import type {
  EventWithOrganization,
  PaymentService,
} from '#app/payment/payment.service';
import { PaymentRequestedMessage } from '#app/payment/messages/requested.mail';
import { PaymentReminderMessage } from '#app/payment/messages/reminder.mail';

vi.mock('#app/payment/messages/requested.mail', () => ({
  PaymentRequestedMessage: { enqueueFor: vi.fn() },
}));
vi.mock('#app/payment/messages/reminder.mail', () => ({
  PaymentReminderMessage: { enqueueFor: vi.fn() },
}));

const paymentService = mock<PaymentService>();
const service = new PaymentCollectionService(paymentService);

const event = {
  id: 'event-1',
  organizationId: 'org-1',
  currency: 'EUR',
  organization: { verificationStatus: 'VERIFIED' },
} as EventWithOrganization;

const buildRegistration = (
  overrides: Partial<Registration> = {},
): Registration =>
  ({
    id: 'registration-1',
    eventId: event.id,
    status: 'ACCEPTED',
    amountDue: 5000,
    paymentRequestedAt: null,
    ...overrides,
  }) as Registration;

const balance = (outstanding: number) =>
  ({ outstanding, amountDue: 5000, amountPaid: 5000 - outstanding }) as never;

const collection = {
  settings: {
    enabled: true,
    timing: 'ACCEPTANCE',
    requestDate: null,
    requestDaysBeforeStart: null,
    reminderAfterDays: null,
  },
  accountReady: true,
} as const;

beforeEach(() => {
  vi.clearAllMocks();
  paymentService.getBalance.mockResolvedValue(balance(5000));
  paymentService.getCollection.mockResolvedValue(collection);
  paymentService.getSettings.mockResolvedValue(collection.settings);
  paymentService.isCollecting.mockReturnValue(true);
});

describe('PaymentCollectionService.requestOnAcceptance', () => {
  it('asks an accepted registration that owes money', async () => {
    const registration = buildRegistration();

    await expect(
      service.requestOnAcceptance(event, registration),
    ).resolves.toBe(true);
    expect(paymentService.markRequested).toHaveBeenCalledWith(registration);
    expect(PaymentRequestedMessage.enqueueFor).toHaveBeenCalledWith(
      event,
      registration,
    );
  });

  it('does not ask someone who already paid', async () => {
    paymentService.getBalance.mockResolvedValue(balance(0));

    await expect(
      service.requestOnAcceptance(event, buildRegistration()),
    ).resolves.toBe(false);
    expect(PaymentRequestedMessage.enqueueFor).not.toHaveBeenCalled();
  });

  it('does not ask twice', async () => {
    await service.requestOnAcceptance(
      event,
      buildRegistration({ paymentRequestedAt: new Date() }),
    );

    expect(PaymentRequestedMessage.enqueueFor).not.toHaveBeenCalled();
  });

  it.each(['PENDING', 'WAITLISTED'] as const)(
    'never asks a %s registration',
    async (status) => {
      await service.requestOnAcceptance(event, buildRegistration({ status }));

      expect(PaymentRequestedMessage.enqueueFor).not.toHaveBeenCalled();
    },
  );

  it('waits while the event does not collect', async () => {
    paymentService.isCollecting.mockReturnValue(false);

    await service.requestOnAcceptance(event, buildRegistration());

    expect(PaymentRequestedMessage.enqueueFor).not.toHaveBeenCalled();
  });
});

describe('PaymentCollectionService.request', () => {
  it('refuses a registration that owes nothing', async () => {
    paymentService.getBalance.mockResolvedValue(balance(0));

    await expect(
      service.request(event, buildRegistration()),
    ).rejects.toMatchObject({ code: 'PAYMENT_NOTHING_DUE' });
  });

  it('refuses a registration that is not accepted', async () => {
    await expect(
      service.request(event, buildRegistration({ status: 'PENDING' })),
    ).rejects.toMatchObject({ code: 'PAYMENT_NOT_ACCEPTED' });
  });

  it('refuses while the event does not collect', async () => {
    paymentService.isCollecting.mockReturnValue(false);

    await expect(
      service.request(event, buildRegistration()),
    ).rejects.toMatchObject({ code: 'PAYMENT_REQUESTS_CLOSED' });
  });

  it('re-sends a request', async () => {
    await service.request(
      event,
      buildRegistration({ paymentRequestedAt: new Date() }),
    );

    expect(PaymentRequestedMessage.enqueueFor).toHaveBeenCalledTimes(1);
  });
});

describe('PaymentCollectionService.forNewRegistration', () => {
  it('opens a checkout for a registration accepted on submit', async () => {
    paymentService.startCheckout.mockResolvedValue({
      checkoutUrl: 'https://checkout.example/abc',
      payment: {} as never,
    });
    const registration = buildRegistration();

    const meta = await service.forNewRegistration(event, registration);

    expect(paymentService.startCheckout).toHaveBeenCalledWith(
      event,
      registration,
    );
    expect(meta).toMatchObject({
      checkoutUrl: 'https://checkout.example/abc',
      pageUrl: expect.stringContaining(
        `/events/${event.id}/registrations/${registration.id}/payment?token=`,
      ) as unknown,
    });
  });

  it('still answers when the checkout fails', async () => {
    paymentService.startCheckout.mockRejectedValue(new Error('provider down'));

    await expect(
      service.forNewRegistration(event, buildRegistration()),
    ).resolves.toMatchObject({ checkoutUrl: null });
  });

  it('opens no checkout before the request date', async () => {
    paymentService.isCollecting.mockReturnValue(false);

    await expect(
      service.forNewRegistration(event, buildRegistration()),
    ).resolves.toMatchObject({ checkoutUrl: null });
    expect(paymentService.startCheckout).not.toHaveBeenCalled();
  });

  it('adds nothing while payments are disabled', async () => {
    paymentService.getSettings.mockResolvedValue({
      ...collection.settings,
      enabled: false,
    });

    await expect(
      service.forNewRegistration(event, buildRegistration()),
    ).resolves.toBeNull();
  });
});

describe('PaymentCollectionService.statusChanged', () => {
  it('asks on acceptance unless messages are suppressed', async () => {
    const registration = buildRegistration();

    await service.statusChanged(event, 'PENDING', registration, {
      notify: false,
    });
    expect(PaymentRequestedMessage.enqueueFor).not.toHaveBeenCalled();

    await service.statusChanged(event, 'PENDING', registration, {
      notify: true,
    });
    expect(PaymentRequestedMessage.enqueueFor).toHaveBeenCalledTimes(1);
  });

  it('closes the checkouts of a registration no longer accepted', async () => {
    const registration = buildRegistration({ status: 'WAITLISTED' });

    await service.statusChanged(event, 'ACCEPTED', registration, {
      notify: true,
    });

    expect(paymentService.closeStaleCheckouts).toHaveBeenCalledWith(
      event,
      registration,
      0,
    );
  });
});

describe('PaymentCollectionService.sendDueReminders', () => {
  it('reminds each due registration and keeps going after a failure', async () => {
    const first = buildRegistration({ id: 'first' });
    const second = buildRegistration({ id: 'second' });
    paymentService.findDueReminders.mockResolvedValue([
      { event, registration: first },
      { event, registration: second },
    ]);
    vi.mocked(PaymentReminderMessage.enqueueFor).mockRejectedValueOnce(
      new Error('queue down'),
    );

    await expect(service.sendDueReminders()).resolves.toBe(1);
    expect(paymentService.markReminded).toHaveBeenCalledTimes(1);
    expect(paymentService.markReminded).toHaveBeenCalledWith('second');
  });
});
