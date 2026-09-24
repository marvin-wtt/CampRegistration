import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { mock } from 'vitest-mock-extended';
import httpStatus from 'http-status';
import type { Event, Prisma } from '#generated/prisma/client.js';
import { RegistrationService } from '#app/registration/registration.service';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { RegistrationController } from '#app/registration/registration.controller';
import { RegistrationResource } from '#app/registration/registration.resource';
import { RegistrationNotifyMessage } from '#app/registration/messages/notify.mail';
import { RegistrationAcceptedMessage } from '#app/registration/messages/accepted.mail';
import { RegistrationConfirmedMessage } from '#app/registration/messages/confirmed.mail';
import { RegistrationDeletedMessage } from '#app/registration/messages/deleted.mail';
import { RegistrationSubmittedMessage } from '#app/registration/messages/submitted.mail';
import { RegistrationUpdatedMessage } from '#app/registration/messages/updated.mail';
import { RegistrationWaitlistedMessage } from '#app/registration/messages/waitlisted.mail';
import { PaymentService } from '#app/payment/payment.service';
import { PaymentRequestedMessage } from '#app/payment/messages/requested.mail';

vi.mock('#app/registration/messages/notify.mail', () => ({
  RegistrationNotifyMessage: { enqueue: vi.fn() },
}));
vi.mock('#app/registration/messages/accepted.mail', () => ({
  RegistrationAcceptedMessage: { enqueueFor: vi.fn() },
}));
vi.mock('#app/registration/messages/confirmed.mail', () => ({
  RegistrationConfirmedMessage: { enqueueFor: vi.fn() },
}));
vi.mock('#app/registration/messages/deleted.mail', () => ({
  RegistrationDeletedMessage: { enqueueFor: vi.fn() },
}));
vi.mock('#app/registration/messages/submitted.mail', () => ({
  RegistrationSubmittedMessage: { enqueueFor: vi.fn() },
}));
vi.mock('#app/registration/messages/updated.mail', () => ({
  RegistrationUpdatedMessage: { enqueueFor: vi.fn() },
}));
vi.mock('#app/registration/messages/waitlisted.mail', () => ({
  RegistrationWaitlistedMessage: { enqueueFor: vi.fn() },
}));
vi.mock('#app/payment/messages/requested.mail', () => ({
  PaymentRequestedMessage: { enqueueFor: vi.fn() },
}));

const registrationService = mock<RegistrationService>();
const realtimeService = mock<RealtimeService>();
const paymentService = mock<PaymentService>();

const controller = new RegistrationController(
  registrationService,
  realtimeService,
  paymentService,
);

// A real form and the variables `setVariables` reads, so the update path can
// actually diff the answers rather than silently falling back to an empty list.
const event = {
  id: 'event-1',
  countries: ['de'],
  name: { en: 'Event' },
  organizer: { en: 'Organizer' },
  contactEmail: { en: 'event@example.com' },
  maxParticipants: { en: 10 },
  startAt: new Date('2026-07-01T00:00:00.000Z'),
  endAt: new Date('2026-07-14T00:00:00.000Z'),
  minAge: 10,
  maxAge: 18,
  location: null,
  price: { en: 100 },
  form: {
    elements: [{ type: 'text', name: 'first_name', title: 'First name' }],
  },
} as unknown as Event;

// Mirrors the `registrationInclude` used throughout RegistrationService, so
// the returned shape (bed + files) matches what the controller receives.
type RegistrationEntity = Prisma.RegistrationGetPayload<{
  include: {
    bed: { include: { room: true } };
    files: { select: { id: true; field: true } };
    payments: {
      select: {
        status: true;
        amount: true;
        refunds: { select: { status: true; amount: true } };
      };
    };
    event: { select: { id: true; currency: true } };
  };
}>;

const buildRegistration = (
  overrides: Partial<RegistrationEntity> = {},
): RegistrationEntity =>
  ({
    id: 'registration-1',
    eventId: event.id,
    status: 'PENDING',
    data: {},
    customData: null,
    firstName: null,
    lastName: null,
    role: null,
    gender: null,
    dateOfBirth: null,
    emails: [],
    street: null,
    city: null,
    zipCode: null,
    country: null,
    newsletterConsent: null,
    locale: 'en-US',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    amountDue: null,
    paymentRequestedAt: null,
    paymentReminderSentAt: null,
    bed: null,
    files: [],
    payments: [],
    event: { id: event.id, currency: 'EUR' },
    ...overrides,
  }) as unknown as RegistrationEntity;

interface FakeRequestOptions {
  models?: Record<string, unknown>;
  validateResult?: unknown;
  sessionId?: string;
  preferredLocale?: string;
}

const fakeRequest = ({
  models = {},
  validateResult = {},
  sessionId = 'session-1',
  preferredLocale = 'en',
}: FakeRequestOptions = {}): Request =>
  ({
    modelOrFail: (key: string) => models[key],
    validate: vi.fn().mockResolvedValue(validateResult),
    sessionId,
    preferredLocale: () => preferredLocale,
  }) as unknown as Request;

const fakeResponse = (): Response & {
  resource: ReturnType<typeof vi.fn>;
  status: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
} => {
  const res = {} as Response & {
    resource: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
  };
  res.resource = vi.fn().mockReturnValue(res);
  res.status = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
};

const resourceData = (res: ReturnType<typeof fakeResponse>): unknown =>
  (res.resource.mock.calls[0]?.[0] as RegistrationResource | undefined)?.[
    'data' as never
  ];

const disabledPayments = {
  enabled: false,
  timing: 'ACCEPTANCE',
  reminderAfterDays: null,
} as const;

beforeEach(() => {
  vi.clearAllMocks();
  paymentService.getSettings.mockResolvedValue(disabledPayments);
});

describe('RegistrationController.show', () => {
  it('resolves the bound registration model into a resource', () => {
    const registration = buildRegistration();
    const req = fakeRequest({ models: { registration } });
    const res = fakeResponse();

    controller.show(req, res);

    expect(resourceData(res)).toBe(registration);
  });
});

describe('RegistrationController.index', () => {
  it('lists the event’s registrations as a resource collection', async () => {
    const registrations = [buildRegistration(), buildRegistration()];
    registrationService.queryRegistrations.mockResolvedValue(registrations);
    const req = fakeRequest({ models: { event } });
    const res = fakeResponse();

    await controller.index(req, res);

    expect(registrationService.queryRegistrations).toHaveBeenCalledWith(
      event.id,
    );
    expect(res.resource).toHaveBeenCalledTimes(1);
  });
});

describe('RegistrationController.store', () => {
  it('enqueues the confirmation message and emits a realtime create event for accepted registrations', async () => {
    const registration = buildRegistration({ status: 'ACCEPTED' });
    registrationService.createRegistration.mockResolvedValue(registration);
    const req = fakeRequest({
      models: { event },
      validateResult: { body: { data: {}, locale: null } },
    });
    const res = fakeResponse();

    await controller.store(req, res);

    expect(RegistrationConfirmedMessage.enqueueFor).toHaveBeenCalledWith(
      event,
      registration,
    );
    expect(RegistrationWaitlistedMessage.enqueueFor).not.toHaveBeenCalled();
    expect(RegistrationSubmittedMessage.enqueueFor).not.toHaveBeenCalled();
    expect(RegistrationNotifyMessage.enqueue).toHaveBeenCalledWith({
      event,
      registration,
    });
    expect(realtimeService.emit).toHaveBeenCalledWith(
      event.id,
      'registration',
      registration.id,
      'created',
    );
    expect(res.status).toHaveBeenCalledWith(httpStatus.CREATED);
    expect(resourceData(res)).toBe(registration);
  });

  it('enqueues the waitlisted message for waitlisted registrations', async () => {
    const registration = buildRegistration({ status: 'WAITLISTED' });
    registrationService.createRegistration.mockResolvedValue(registration);
    const req = fakeRequest({
      models: { event },
      validateResult: { body: { data: {}, locale: null } },
    });

    await controller.store(req, fakeResponse());

    expect(RegistrationWaitlistedMessage.enqueueFor).toHaveBeenCalledWith(
      event,
      registration,
    );
    expect(RegistrationConfirmedMessage.enqueueFor).not.toHaveBeenCalled();
    expect(RegistrationSubmittedMessage.enqueueFor).not.toHaveBeenCalled();
  });

  it('enqueues the submitted message for pending registrations', async () => {
    const registration = buildRegistration({ status: 'PENDING' });
    registrationService.createRegistration.mockResolvedValue(registration);
    const req = fakeRequest({
      models: { event },
      validateResult: { body: { data: {}, locale: null } },
    });

    await controller.store(req, fakeResponse());

    expect(RegistrationSubmittedMessage.enqueueFor).toHaveBeenCalledWith(
      event,
      registration,
    );
    expect(RegistrationConfirmedMessage.enqueueFor).not.toHaveBeenCalled();
    expect(RegistrationWaitlistedMessage.enqueueFor).not.toHaveBeenCalled();
  });
});

describe('RegistrationController.update', () => {
  it('enqueues the waitlist-accepted message when status moves from WAITLISTED to ACCEPTED', async () => {
    const previousRegistration = buildRegistration({ status: 'WAITLISTED' });
    const registration = buildRegistration({ status: 'ACCEPTED' });
    registrationService.updateRegistrationById.mockResolvedValue(registration);
    const req = fakeRequest({
      models: { event, registration: previousRegistration },
      validateResult: {
        body: { status: 'ACCEPTED' },
        query: { suppressMessage: false },
      },
    });

    await controller.update(req, fakeResponse());

    expect(RegistrationAcceptedMessage.enqueueFor).toHaveBeenCalledWith(
      event,
      registration,
    );
    expect(RegistrationConfirmedMessage.enqueueFor).not.toHaveBeenCalled();
    expect(realtimeService.emit).toHaveBeenCalledWith(
      event.id,
      'registration',
      registration.id,
      'updated',
    );
  });

  it('enqueues the confirmed message when status moves from PENDING to ACCEPTED', async () => {
    const previousRegistration = buildRegistration({ status: 'PENDING' });
    const registration = buildRegistration({ status: 'ACCEPTED' });
    registrationService.updateRegistrationById.mockResolvedValue(registration);
    const req = fakeRequest({
      models: { event, registration: previousRegistration },
      validateResult: {
        body: { status: 'ACCEPTED' },
        query: { suppressMessage: false },
      },
    });

    await controller.update(req, fakeResponse());

    expect(RegistrationConfirmedMessage.enqueueFor).toHaveBeenCalledWith(
      event,
      registration,
    );
    expect(RegistrationAcceptedMessage.enqueueFor).not.toHaveBeenCalled();
  });

  it('does not enqueue the waitlist-accepted message when suppressMessage is set', async () => {
    const previousRegistration = buildRegistration({ status: 'WAITLISTED' });
    const registration = buildRegistration({ status: 'ACCEPTED' });
    registrationService.updateRegistrationById.mockResolvedValue(registration);
    const req = fakeRequest({
      models: { event, registration: previousRegistration },
      validateResult: {
        body: { status: 'ACCEPTED' },
        query: { suppressMessage: true },
      },
    });

    await controller.update(req, fakeResponse());

    expect(RegistrationAcceptedMessage.enqueueFor).not.toHaveBeenCalled();
    // Realtime updates still fire even when the notification email is suppressed.
    expect(realtimeService.emit).toHaveBeenCalledWith(
      event.id,
      'registration',
      registration.id,
      'updated',
    );
  });

  it('does not enqueue the waitlist-accepted message when the status stays WAITLISTED', async () => {
    const previousRegistration = buildRegistration({ status: 'WAITLISTED' });
    const registration = buildRegistration({ status: 'WAITLISTED' });
    registrationService.updateRegistrationById.mockResolvedValue(registration);
    const req = fakeRequest({
      models: { event, registration: previousRegistration },
      validateResult: {
        body: {},
        query: { suppressMessage: false },
      },
    });

    await controller.update(req, fakeResponse());

    expect(RegistrationAcceptedMessage.enqueueFor).not.toHaveBeenCalled();
  });

  it('enqueues the updated message when form data changes', async () => {
    const previousRegistration = buildRegistration({
      status: 'ACCEPTED',
      data: { first_name: 'Jane' },
    });
    const registration = buildRegistration({
      status: 'ACCEPTED',
      data: { first_name: 'John' },
    });
    registrationService.updateRegistrationById.mockResolvedValue(registration);
    const req = fakeRequest({
      models: { event, registration: previousRegistration },
      validateResult: {
        body: { data: { first_name: 'John' } },
        query: { suppressMessage: false },
      },
    });

    await controller.update(req, fakeResponse());

    // The diff travels with the mail, not the previous answers themselves.
    expect(RegistrationUpdatedMessage.enqueueFor).toHaveBeenCalledWith(
      event,
      registration,
      [
        {
          path: 'first_name',
          label: 'First name',
          value: 'John',
          isFile: false,
        },
      ],
    );
  });
});

describe('RegistrationController.destroy', () => {
  it('enqueues the deleted message and emits a realtime delete event', async () => {
    const registration = buildRegistration();
    const req = fakeRequest({
      models: { event, registration },
      validateResult: { query: { suppressMessage: false } },
    });
    const res = fakeResponse();

    await controller.destroy(req, res);

    expect(registrationService.deleteRegistration).toHaveBeenCalledWith(
      registration,
    );
    expect(RegistrationDeletedMessage.enqueueFor).toHaveBeenCalledWith(
      event,
      registration,
    );
    expect(realtimeService.emit).toHaveBeenCalledWith(
      event.id,
      'registration',
      registration.id,
      'deleted',
    );
    expect(res.status).toHaveBeenCalledWith(httpStatus.NO_CONTENT);
  });

  it('does not enqueue the deleted message when suppressMessage is set', async () => {
    const registration = buildRegistration();
    const req = fakeRequest({
      models: { event, registration },
      validateResult: { query: { suppressMessage: true } },
    });

    await controller.destroy(req, fakeResponse());

    expect(RegistrationDeletedMessage.enqueueFor).not.toHaveBeenCalled();
  });
});

describe('RegistrationController payments', () => {
  const resourceMeta = (res: ReturnType<typeof fakeResponse>): unknown =>
    (
      res.resource.mock.calls[0]?.[0] as RegistrationResource | undefined
    )?.getAllMetadata();

  const storeRequest = () =>
    fakeRequest({
      models: { event },
      validateResult: { body: { data: {}, locale: null } },
    });

  it('adds no payment meta when the registration owes nothing', async () => {
    registrationService.createRegistration.mockResolvedValue(
      buildRegistration({ status: 'ACCEPTED' }),
    );
    const res = fakeResponse();

    await controller.store(storeRequest(), res);

    expect(resourceMeta(res)).toEqual({});
    expect(paymentService.startCheckout).not.toHaveBeenCalled();
  });

  it('opens a checkout at registration and returns its URL', async () => {
    const registration = buildRegistration({
      status: 'ACCEPTED',
      amountDue: 5000,
    });
    registrationService.createRegistration.mockResolvedValue(registration);
    paymentService.getSettings.mockResolvedValue({
      ...disabledPayments,
      enabled: true,
      timing: 'REGISTRATION',
    });
    paymentService.startCheckout.mockResolvedValue({
      checkoutUrl: 'https://checkout.example/abc',
      payment: {} as never,
    });
    const res = fakeResponse();

    await controller.store(storeRequest(), res);

    expect(paymentService.markRequested).toHaveBeenCalledWith(registration.id);
    expect(resourceMeta(res)).toMatchObject({
      payment: {
        checkoutUrl: 'https://checkout.example/abc',
        pageUrl: expect.stringContaining(
          `/events/${event.id}/registrations/${registration.id}/payment?token=`,
        ) as unknown,
      },
    });
  });

  it('still creates the registration when the checkout fails', async () => {
    registrationService.createRegistration.mockResolvedValue(
      buildRegistration({ status: 'PENDING', amountDue: 5000 }),
    );
    paymentService.getSettings.mockResolvedValue({
      ...disabledPayments,
      enabled: true,
      timing: 'REGISTRATION',
    });
    paymentService.startCheckout.mockRejectedValue(new Error('provider down'));
    const res = fakeResponse();

    await controller.store(storeRequest(), res);

    expect(res.status).toHaveBeenCalledWith(httpStatus.CREATED);
    expect(resourceMeta(res)).toMatchObject({
      payment: { checkoutUrl: null },
    });
  });

  it('never charges a waitlisted registration up front', async () => {
    registrationService.createRegistration.mockResolvedValue(
      buildRegistration({ status: 'WAITLISTED', amountDue: 5000 }),
    );
    paymentService.getSettings.mockResolvedValue({
      ...disabledPayments,
      enabled: true,
      timing: 'REGISTRATION',
    });

    await controller.store(storeRequest(), fakeResponse());

    expect(paymentService.startCheckout).not.toHaveBeenCalled();
  });

  it('emails the payment link when an automatically accepted registration owes money after acceptance', async () => {
    const registration = buildRegistration({
      status: 'ACCEPTED',
      amountDue: 5000,
    });
    registrationService.createRegistration.mockResolvedValue(registration);
    paymentService.getSettings.mockResolvedValue({
      ...disabledPayments,
      enabled: true,
    });

    await controller.store(storeRequest(), fakeResponse());

    expect(PaymentRequestedMessage.enqueueFor).toHaveBeenCalledWith(
      event,
      registration,
    );
    expect(paymentService.startCheckout).not.toHaveBeenCalled();
  });

  it('emails the payment link when a manager accepts the registration', async () => {
    const registration = buildRegistration({
      status: 'ACCEPTED',
      amountDue: 5000,
    });
    registrationService.updateRegistrationById.mockResolvedValue(registration);
    paymentService.getSettings.mockResolvedValue({
      ...disabledPayments,
      enabled: true,
    });
    const req = fakeRequest({
      models: { event, registration: buildRegistration() },
      validateResult: {
        body: { status: 'ACCEPTED' },
        query: { suppressMessage: false },
      },
    });

    await controller.update(req, fakeResponse());

    expect(PaymentRequestedMessage.enqueueFor).toHaveBeenCalledWith(
      event,
      registration,
    );
    expect(paymentService.markRequested).toHaveBeenCalledWith(registration.id);
  });

  it('does not request payment twice', async () => {
    registrationService.updateRegistrationById.mockResolvedValue(
      buildRegistration({
        status: 'ACCEPTED',
        amountDue: 5000,
        paymentRequestedAt: new Date(),
      }),
    );
    paymentService.getSettings.mockResolvedValue({
      ...disabledPayments,
      enabled: true,
    });
    const req = fakeRequest({
      models: { event, registration: buildRegistration() },
      validateResult: {
        body: { status: 'ACCEPTED' },
        query: { suppressMessage: false },
      },
    });

    await controller.update(req, fakeResponse());

    expect(PaymentRequestedMessage.enqueueFor).not.toHaveBeenCalled();
  });
});
