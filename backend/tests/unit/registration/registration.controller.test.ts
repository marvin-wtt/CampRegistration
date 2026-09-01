import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { mock } from 'vitest-mock-extended';
import httpStatus from 'http-status';
import type { Event, Prisma } from '#generated/prisma/client.js';
import { RegistrationService } from '#app/registration/registration.service';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { RegistrationController } from '#app/registration/registration.controller';
import { RegistrationResource } from '#app/registration/registration.resource';
import {
  RegistrationAcceptedMessage,
  RegistrationConfirmedMessage,
  RegistrationDeletedMessage,
  RegistrationNotifyMessage,
  RegistrationSubmittedMessage,
  RegistrationUpdatedMessage,
  RegistrationWaitlistedMessage,
} from '#app/registration/registration.messages';

vi.mock('#app/registration/registration.messages', () => ({
  RegistrationAcceptedMessage: { enqueueFor: vi.fn() },
  RegistrationConfirmedMessage: { enqueueFor: vi.fn() },
  RegistrationDeletedMessage: { enqueueFor: vi.fn() },
  RegistrationNotifyMessage: { enqueue: vi.fn() },
  RegistrationSubmittedMessage: { enqueueFor: vi.fn() },
  RegistrationUpdatedMessage: { enqueueFor: vi.fn() },
  RegistrationWaitlistedMessage: { enqueueFor: vi.fn() },
}));

const registrationService = mock<RegistrationService>();
const realtimeService = mock<RealtimeService>();

const controller = new RegistrationController(
  registrationService,
  realtimeService,
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
    bed: null,
    files: [],
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

beforeEach(() => {
  vi.clearAllMocks();
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
