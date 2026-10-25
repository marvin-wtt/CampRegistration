import { describe, expect, it } from 'vitest';
import prisma from '../utils/prisma.js';
import { request } from '../utils/request.js';
import { generateAccessToken } from './utils/token.js';
import {
  expectEmailCount,
  expectEmailWith,
  expectNoEmailWith,
} from '../utils/mail.js';
import {
  EventFactory,
  EventManagerFactory,
  RegistrationFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import type { Event, Prisma } from '#generated/prisma/client.js';
import {
  addressIn,
  eventNationalWithAddress,
  eventWithFreeAddress,
  eventWithGroupMessages,
  eventWithStrictAddress,
  eventWithStrictCountry,
  eventWithWarnAddress,
  groupTemplates,
} from './fixtures/registration-group.fixtures.js';

// The group is chosen before the form and stored apart from the address's
// country; these tests read both back from the database, not only the response.
describe('registration groups', () => {
  const register = (event: Event, body: object) =>
    request().post(`/api/v1/events/${event.id}/registrations`).send(body);

  const stored = (id: string) =>
    prisma.registration.findUniqueOrThrow({ where: { id } });

  const managerOf = async (
    event: Event,
    role: 'DIRECTOR' | 'COUNSELOR' = 'DIRECTOR',
  ) => {
    const user = await UserFactory.create();
    await EventManagerFactory.create({
      event: { connect: { id: event.id } },
      user: { connect: { id: user.id } },
      role,
    });
    return generateAccessToken(user);
  };

  const registrationIn = (
    event: Event,
    data: Partial<Prisma.RegistrationCreateInput>,
  ) =>
    RegistrationFactory.create({
      ...data,
      event: { connect: { id: event.id } },
    });

  describe('POST /api/v1/events/:eventId/registrations', () => {
    it('stores the group and the address apart for a registration from abroad', async () => {
      const event = await EventFactory.create(eventWithWarnAddress);

      const { body } = await register(event, {
        data: { first_name: 'Ann', address: addressIn('de') },
        group: 'fr',
      }).expect(201);

      const registration = await stored(body.data.id);
      expect(registration).toMatchObject({
        group: 'fr',
        country: 'de',
        street: 'Main Street 1',
        zipCode: '12345',
        city: 'Sometown',
        firstName: 'Ann',
      });
      expect(body.data).toHaveProperty('group', 'fr');
      expect(body.data.computedData.address).toEqual({
        street: 'Main Street 1',
        zipCode: '12345',
        city: 'Sometown',
        country: 'de',
      });
    });

    // The form shows the group's country locked, so that is what it submits.
    it("stores a strict address in the group's country", async () => {
      const event = await EventFactory.create(eventWithStrictAddress);

      const { body } = await register(event, {
        data: { first_name: 'Ann', address: addressIn('fr') },
        group: 'fr',
      }).expect(201);

      const registration = await stored(body.data.id);
      expect(registration.group).toBe('fr');
      expect(registration.country).toBe('fr');
      expect(registration.data).toHaveProperty('address.country', 'fr');
    });

    // The server reads the answers as sent; it fills in nothing.
    it('rejects a strict address without a country', async () => {
      const event = await EventFactory.create(eventWithStrictAddress);

      const { body } = await register(event, {
        data: { first_name: 'Ann', address: addressIn() },
        group: 'fr',
      }).expect(400);

      expect(JSON.stringify(body)).toContain('address');
      expect(await prisma.registration.count()).toBe(0);
    });

    it("rejects a strict address in another country than the group's", async () => {
      const event = await EventFactory.create(eventWithStrictAddress);

      await register(event, {
        data: { first_name: 'Ann', address: addressIn('de') },
        group: 'fr',
      }).expect(400);

      expect(await prisma.registration.count()).toBe(0);
    });

    it("rejects a strict country question in another country than the group's", async () => {
      const event = await EventFactory.create(eventWithStrictCountry);

      await register(event, {
        data: { first_name: 'Ann', country: 'de' },
        group: 'fr',
      }).expect(400);

      expect(await prisma.registration.count()).toBe(0);
    });

    it('accepts a free address country without filling it in', async () => {
      const event = await EventFactory.create(eventWithFreeAddress);

      const { body } = await register(event, {
        data: { first_name: 'Ann', address: addressIn('it') },
        group: 'de',
      }).expect(201);

      const registration = await stored(body.data.id);
      expect(registration).toMatchObject({ group: 'de', country: 'it' });
    });

    it('stores the group in lower case', async () => {
      const event = await EventFactory.create(eventWithWarnAddress);

      const { body } = await register(event, {
        data: { first_name: 'Ann', address: addressIn('fr') },
        group: 'FR',
      }).expect(201);

      expect((await stored(body.data.id)).group).toBe('fr');
    });

    it('stores the only country of a single-country event as its group', async () => {
      const event = await EventFactory.create(eventNationalWithAddress);

      const { body } = await register(event, {
        data: { first_name: 'Ann', address: addressIn('de') },
      }).expect(201);

      const registration = await stored(body.data.id);
      expect(registration).toMatchObject({ group: 'de', country: 'de' });
    });
  });

  describe('PATCH /api/v1/events/:eventId/registrations/:registrationId', () => {
    it('keeps the group when a manager edits the answers', async () => {
      const event = await EventFactory.create(eventWithWarnAddress);
      const accessToken = await managerOf(event);
      const registration = await registrationIn(event, {
        group: 'fr',
        country: 'fr',
        data: { first_name: 'Ann', address: addressIn('fr') },
      });

      await request()
        .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
        .send({ data: { first_name: 'Ann', address: addressIn('de') } })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(await stored(registration.id)).toMatchObject({
        group: 'fr',
        country: 'de',
      });
    });

    it('moves the registration to another group and changes nothing else', async () => {
      const event = await EventFactory.create(eventWithStrictAddress);
      const accessToken = await managerOf(event);
      const data = { first_name: 'Ann', address: addressIn('de') };
      const registration = await registrationIn(event, {
        group: 'de',
        country: 'de',
        status: 'WAITLISTED',
        data,
      });

      await request()
        .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
        .send({ group: 'fr' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(await stored(registration.id)).toMatchObject({
        group: 'fr',
        country: 'de',
        status: 'WAITLISTED',
        data,
      });
      expectEmailCount(0);

      const log = await prisma.auditLog.findFirst({
        where: {
          entityType: 'registration',
          entityId: registration.id,
          action: 'updated',
        },
      });
      expect(log?.details).toEqual({
        changedFields: ['group'],
        values: { group: 'fr' },
      });
    });

    it('rejects a group the event does not run', async () => {
      const event = await EventFactory.create(eventWithStrictAddress);
      const accessToken = await managerOf(event);
      const registration = await registrationIn(event, { group: 'de' });

      await request()
        .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
        .send({ group: 'it' })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      expect((await stored(registration.id)).group).toBe('de');
    });

    it('lets only managers who may edit registrations move one', async () => {
      const event = await EventFactory.create(eventWithStrictAddress);
      const accessToken = await managerOf(event, 'COUNSELOR');
      const registration = await registrationIn(event, { group: 'de' });

      await request()
        .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
        .send({ group: 'fr' })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      expect((await stored(registration.id)).group).toBe('de');
    });
  });

  describe('messages after registering', () => {
    const eventWithMessages = (data: Partial<Prisma.EventCreateInput> = {}) =>
      EventFactory.create({
        ...eventWithGroupMessages,
        ...data,
        messageTemplates: { createMany: { data: groupTemplates } },
      });

    const registerIn = (event: Event, group: string) =>
      register(event, {
        data: { first_name: 'Ann', email: 'ann@example.com' },
        group,
      }).expect(201);

    it("confirms with the group's template, answered by the group's contact", async () => {
      const event = await eventWithMessages();

      await registerIn(event, 'fr');

      expectEmailWith({
        to: 'ann@example.com',
        subject: 'registration_confirmed fr',
        replyTo: 'fr@example.com',
      });
      expectNoEmailWith({ subject: 'registration_confirmed de' });
    });

    it("puts a registration on the full group's waiting list, not the other's", async () => {
      const event = await eventWithMessages({
        maxParticipants: { de: 5, fr: 0 },
      });

      const waitlisted = await registerIn(event, 'fr');
      const accepted = await registerIn(event, 'de');

      expect(waitlisted.body.data).toMatchObject({
        status: 'WAITLISTED',
        group: 'fr',
      });
      expect(accepted.body.data).toMatchObject({
        status: 'ACCEPTED',
        group: 'de',
      });
      expectEmailWith({ subject: 'registration_waitlisted fr' });
      expectEmailWith({ subject: 'registration_confirmed de' });
    });

    it("announces a pending registration with the group's template", async () => {
      const event = await eventWithMessages({ confirmationMode: 'MANUAL' });

      const { body } = await registerIn(event, 'de');

      expect(body.data).toHaveProperty('status', 'PENDING');
      expectEmailWith({
        to: 'ann@example.com',
        subject: 'registration_submitted de',
      });
      expectNoEmailWith({ subject: 'registration_confirmed de' });
    });

    it("notifies only the group's contact about a new registration", async () => {
      const event = await eventWithMessages();

      await registerIn(event, 'de');

      expectEmailWith({ to: 'de@example.com' });
      expectNoEmailWith({ to: 'fr@example.com' });
    });
  });

  describe('saving the form', () => {
    it("re-extracts the address's country and keeps the group", async () => {
      const event = await EventFactory.create(eventWithWarnAddress);
      const accessToken = await managerOf(event);
      // Stored before the extraction rule took the country from the address.
      const registration = await registrationIn(event, {
        group: 'fr',
        country: 'fr',
        data: { first_name: 'Ann', address: addressIn('de') },
      });

      await request()
        .patch(`/api/v1/events/${event.id}`)
        .send({ form: eventWithWarnAddress.form })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(await stored(registration.id)).toMatchObject({
        group: 'fr',
        country: 'de',
      });
    });
  });
});
