import { describe, expect, it } from 'vitest';
import prisma from '../utils/prisma.js';
import { generateAccessToken } from './utils/token.js';
import {
  EventFactory,
  FileFactory,
  RegistrationFactory,
  UserFactory,
  EventManagerFactory,
  MessageDeliveryFactory,
  MessageTemplateFactory,
} from '../../../prisma/factories/index.js';
import { Event, Prisma } from '#generated/prisma/client.js';
import { ulid } from 'ulidx';
import crypto from 'crypto';
import {
  eventPrivate,
  eventListed,
  eventWithAdditionalFields,
  eventWithEventVariable,
  eventWithCustomFields,
  eventWithFileOptional,
  eventWithFileRequired,
  eventWithMaxParticipantsInternational,
  eventWithMaxParticipantsNational,
  eventWithMaxParticipantsRolesInternational,
  eventWithMaxParticipantsRolesNational,
  eventWithAllEventDataTypes,
  eventWithRequiredField,
  eventWithoutCountryData,
  eventWithEmail,
  eventWithMultipleEmails,
  eventWithContactEmailInternational,
  eventWithEmailAndMaxParticipants,
  eventWithFormFunctions,
  eventWithAddress,
  eventWithMultipleFilesRequired,
  eventWithAddressEventDataTypes,
  eventWithEmailAndCountry,
} from './fixtures/registration.fixtures.js';
import { request } from '../utils/request.js';
import { NoOpMailer } from '#app/mail/noop.mailer.js';
import { uploadFile } from './utils/file.js';
import { expectEmailCount, expectEmailWith } from '../utils/mail.js';
import moment from 'moment';

const mailer = NoOpMailer.prototype;

const createRegistrationWithFile = async () => {
  const event = await EventFactory.create();
  const registration = await RegistrationFactory.create({
    event: { connect: { id: event.id } },
  });

  const fileName = crypto.randomUUID() + '.pdf';
  await uploadFile('blank.pdf', fileName);

  const file = await FileFactory.create({
    registration: { connect: { id: registration.id } },
    name: fileName,
  });

  const user = await UserFactory.create({
    eventRoles: {
      create: EventManagerFactory.build({
        event: { connect: { id: event.id } },
      }),
    },
  });

  const accessToken = generateAccessToken(user);

  return { registration, event, file, user, accessToken };
};

describe('/api/v1/events/:eventId/registrations', () => {
  const createEventWithManagerAndToken = async (
    eventData: Partial<Prisma.EventCreateInput> = {},
    role = 'DIRECTOR',
  ) => {
    const event = await EventFactory.create(eventData);
    const user = await UserFactory.create();
    const manager = await EventManagerFactory.create({
      event: { connect: { id: event.id } },
      user: { connect: { id: user.id } },
      role,
    });
    const accessToken = generateAccessToken(user);

    return {
      event,
      user,
      manager,
      accessToken,
    };
  };

  const createRegistration = async (
    event: Event,
    data?: Partial<Prisma.RegistrationCreateInput>,
  ) => {
    return RegistrationFactory.create({
      ...data,
      event: { connect: { id: event.id } },
    });
  };

  const countRegistrations = async (event: Event) => {
    return prisma.registration.count({
      where: {
        eventId: event.id,
      },
    });
  };

  describe('GET /api/v1/events/:eventId/registrations/', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 200 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } = await createEventWithManagerAndToken(
          undefined,
          role,
        );
        await createRegistration(event);

        const { body } = await request()
          .get(`/api/v1/events/${event.id}/registrations`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        expect(body).toHaveProperty('data');
        expect(body.data).toHaveLength(1);

        // Additional assertions for DIRECTOR role
        if (role === 'DIRECTOR') {
          expect(body.data[0]).toHaveProperty('id');
          expect(body.data[0]).toHaveProperty('room');
        }
      },
    );

    it('should respond with `403` status code when user is not event manager', async () => {
      const event = await EventFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/events/${event.id}/registrations`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const event = await EventFactory.create();

      await request()
        .get(`/api/v1/events/${event.id}/registrations`)
        .send()
        .expect(401);
    });

    it.todo(
      'should respond with `400` status code when query parameters are invalid',
    );
  });

  describe('GET /api/v1/events/:eventId/registrations/:registrationId', () => {
    it('should respond with `200` status code', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken(
        undefined,
        'DIRECTOR',
      );
      const registration = await createRegistration(event);

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/registrations/${registration.id}/`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data');
      const data = body.data;

      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('computedData');
      expect(data).toHaveProperty('computedData.firstName');
      expect(data).toHaveProperty('computedData.lastName');
      expect(data).toHaveProperty('computedData.dateOfBirth');
      expect(data).toHaveProperty('computedData.dateOfBirth');
      expect(data).toHaveProperty('computedData.gender');
      expect(data).toHaveProperty('computedData.address');
      expect(data).toHaveProperty('computedData.role');
      expect(data).toHaveProperty('computedData.emails');
      expect(data).toHaveProperty('customData');
      expect(data).toHaveProperty('locale');
      expect(data).toHaveProperty('room');
      expect(data).toHaveProperty('createdAt');
      expect(data).toHaveProperty('updatedAt');
    });

    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 200 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } = await createEventWithManagerAndToken(
          undefined,
          role,
        );
        const registration = await createRegistration(event);

        const { body } = await request()
          .get(`/api/v1/events/${event.id}/registrations/${registration.id}/`)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        expect(body).toHaveProperty('data');
      },
    );

    it('should respond with `403` status code when user is not event manager', async () => {
      const event = await EventFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());
      const registration = await createRegistration(event);

      await request()
        .get(`/api/v1/events/${event.id}/registrations/${registration.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `403` status code when user is not event manager and registration does not exist', async () => {
      const event = await EventFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());
      const registrationId = ulid();

      await request()
        .get(`/api/v1/events/${event.id}/registrations/${registrationId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const event = await EventFactory.create();
      const registration = await createRegistration(event);

      await request()
        .get(`/api/v1/events/${event.id}/registrations/${registration.id}`)
        .send()
        .expect(401);
    });

    it('should respond with `401` status code when unauthenticated and registration does not exist', async () => {
      const event = await EventFactory.create();
      const registrationId = ulid();

      await request()
        .get(`/api/v1/events/${event.id}/registrations/${registrationId}`)
        .send()
        .expect(401);
    });

    it('should respond with `404` status code when event id does not exists', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const registrationId = ulid();

      await request()
        .get(`/api/v1/events/${event.id}/registrations/${registrationId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('POST /api/v1/events/:eventId/registrations/', () => {
    it('should respond with `201` status code', async () => {
      const event = await EventFactory.create(eventListed);

      const data = {
        data: {
          first_name: 'Jhon',
          last_name: 'Doe',
        },
      };

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/registrations`)
        .send(data)
        .expect(201);

      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('data.id');
      expect(body).toHaveProperty('data.status', 'ACCEPTED');
      expect(body).toHaveProperty('data.data');
      expect(body).toHaveProperty('data.data.first_name', 'Jhon');
      expect(body).toHaveProperty('data.data.last_name', 'Doe');
      expect(body).toHaveProperty('data.computedData');
      expect(body).toHaveProperty('data.customData', {});
      expect(body).toHaveProperty('data.locale');
      expect(body).toHaveProperty('data.room');
      expect(body).toHaveProperty('data.createdAt');
      expect(body).toHaveProperty('data.updatedAt');
    });

    it.each([
      { role: 'DIRECTOR', expectedStatus: 201 },
      { role: 'COORDINATOR', expectedStatus: 201 },
      { role: 'COUNSELOR', expectedStatus: 201 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code for manager override when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } = await createEventWithManagerAndToken(
          {
            ...eventListed,
            registrationClosesAt: moment().subtract(1, 'day').toDate(),
          },
          role,
        );

        const data = {
          data: {
            first_name: 'Jhon',
            last_name: 'Doe',
          },
        };

        await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);
      },
    );

    it('set the registration status to pending without auto-accept', async () => {
      const event = await EventFactory.create({
        ...eventListed,
        confirmationMode: 'MANUAL',
      });

      const data = {
        data: {
          first_name: 'Jhon',
          last_name: 'Doe',
        },
      };

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/registrations`)
        .send(data)
        .expect(201);

      expect(body).toHaveProperty('data.status', 'PENDING');
    });

    it('should respond with `201` status code for private events', async () => {
      const event = await EventFactory.create(eventPrivate);

      const data = {
        first_name: 'Jhon',
      };

      await request()
        .post(`/api/v1/events/${event.id}/registrations`)
        .send({ data })
        .expect(201);
    });

    it('should respond with `401` status code when event is not active', async () => {
      const event1 = await EventFactory.create({
        registrationClosesAt: moment().subtract(1, 'day').toDate(),
      });

      await request()
        .post(`/api/v1/events/${event1.id}/registrations`)
        .send()
        .expect(401);

      const event2 = await EventFactory.create({
        registrationOpensAt: moment().add(1, 'day').toDate(),
      });

      await request()
        .post(`/api/v1/events/${event2.id}/registrations`)
        .send()
        .expect(401);
    });

    it('should respond with `400` status code when additional fields are provided', async () => {
      const event = await EventFactory.create(eventWithAdditionalFields);

      const data = {
        data: {
          first_name: 'Jhon',
          invisible_field: 'should not be stored',
          another_field: 'should not be stored',
        },
      };

      await request()
        .post(`/api/v1/events/${event.id}/registrations`)
        .send(data)
        .expect(400);
    });

    it('should respond with `400` status code when a required field is missing', async () => {
      const event = await EventFactory.create(eventWithRequiredField);

      const data = {
        data: {
          last_name: 'Doe',
        },
      };

      await request()
        .post(`/api/v1/events/${event.id}/registrations`)
        .send(data)
        .expect(400);
    });

    describe('form', () => {
      it('should respond with `201` status code when form has custom questions', async () => {
        const event = await EventFactory.create(eventWithCustomFields);

        const data = {
          first_name: 'Jhon',
          role: 'participant',
        };

        const { body } = await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .send({ data })
          .expect(201);

        expect(body).toHaveProperty('data.data.role', data.role);
      });

      it('should respond with `201` status code when form has event variables', async () => {
        const event = await EventFactory.create(eventWithEventVariable);

        const validData = {
          first_name: 'Jhon',
          age: 11,
        };

        await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .send({ data: validData })
          .expect(201);

        const invalidData = {
          first_name: 'Jhon',
          age: 5,
        };

        await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .send({ data: invalidData })
          .expect(400);
      });

      it('should respond with `201` status code when form has custom functions', async () => {
        const event = await EventFactory.create(eventWithFormFunctions);

        const validData = {
          date: '2000-01-01',
        };

        await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .send({ data: validData })
          .expect(201);

        const invalidData = {
          date: '2001-01-01',
        };

        await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .send({ data: invalidData })
          .expect(400);
      });
    });

    describe('locale', () => {
      it('should set the users preferred locale', async () => {
        const event = await EventFactory.create(eventListed);

        const data = {
          data: {
            first_name: 'Jhon',
          },
        };

        const { body } = await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .set(
            'Accept-Language',
            'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5',
          )
          .send(data)
          .expect(201);

        expect(body).toHaveProperty('data');
        expect(body).toHaveProperty('data.locale', 'fr-CH');
      });

      it('should use given locale over users preferred locale', async () => {
        const event = await EventFactory.create(eventListed);

        const data = {
          data: {
            first_name: 'Jhon',
          },
          locale: 'de',
        };

        const { body } = await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .set(
            'Accept-Language',
            'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5',
          )
          .send(data)
          .expect(201);

        expect(body).toHaveProperty('data');
        expect(body).toHaveProperty('data.locale', 'de');
      });
    });

    describe('files', () => {
      it('should respond with `201` status code when form has file', async () => {
        const sessionId = crypto.randomUUID();
        const event = await EventFactory.create(eventWithFileRequired);
        const file = await FileFactory.create({
          field: sessionId,
          accessLevel: 'private',
        });

        const data = {
          some_field: 'Some value',
          some_file: file.id,
        };

        const { body } = await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .set('Cookie', [
            'session=' + sessionId,
            '__Host-session=' + sessionId,
          ])
          .send({ data })
          .expect(201);

        expect(body).toHaveProperty(`data.id`);
        expect(body).toHaveProperty(`data.data.some_file`);

        expect(body.data.data.some_file).toBe(file.id);

        const updatedFile = await prisma.file.findFirst({
          where: { id: file.id },
        });

        expect(updatedFile?.registrationId).toBe(body.data.id);
      });

      it('should respond with `201` status code when form has multiple files', async () => {
        const sessionId = crypto.randomUUID();
        const event = await EventFactory.create(eventWithMultipleFilesRequired);
        const file1 = await FileFactory.create({
          field: sessionId,
          accessLevel: 'private',
        });
        const file2 = await FileFactory.create({
          field: sessionId,
          accessLevel: 'private',
        });

        const data = {
          some_field: 'Some value',
          some_files: [file1.id, file2.id],
        };

        const { body } = await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .set('Cookie', [
            'session=' + sessionId,
            '__Host-session=' + sessionId,
          ])
          .send({ data })
          .expect(201);

        expect(body).toHaveProperty(`data.id`);
        expect(body).toHaveProperty(`data.data.some_files`);
        expect(body.data.data.some_files).toHaveLength(2);

        expect(body.data.data.some_files[0]).toBe(file1.id);
        expect(body.data.data.some_files[1]).toBe(file2.id);

        const updatedFiles = await prisma.file.findMany({
          where: { registrationId: body.data.id },
        });

        expect(updatedFiles).toHaveLength(2);
      });

      it('should respond with `201` status code when file is optional', async () => {
        const event = await EventFactory.create(eventWithFileOptional);

        const data = {
          some_field: 'Some value',
        };

        await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .send({ data })
          .expect(201);
      });

      it('should respond with `400` status code when file is missing', async () => {
        const event = await EventFactory.create(eventWithFileRequired);
        const fileId = ulid();

        const data = {
          some_field: 'Some value',
          some_file: fileId,
        };

        await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .send({ data })
          .expect(400);
      });

      it('should respond with `400` status code when file field is invalid', async () => {
        const sessionId = crypto.randomUUID();

        const event = await EventFactory.create(eventWithFileRequired);
        const file = await FileFactory.create({
          field: crypto.randomUUID(), // Does not match sessionId
          accessLevel: 'private',
        });

        const data = {
          some_field: 'Some value',
          some_file: file.id,
        };

        await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .set('Cookie', [
            'session=' + sessionId,
            '__Host-session=' + sessionId,
          ])
          .send({ data })
          .expect(400);
      });

      it('should respond with `400` status code when file data is invalid', async () => {
        const event = await EventFactory.create(eventWithFileRequired);

        const data = {
          some_field: 'Some value',
          some_file: {
            name: 'test',
            size: 100,
          },
        };

        await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .send({ data })
          .expect(400);
      });

      it('should respond with `400` status code when file is already assigned to a registration', async () => {
        const sessionId = crypto.randomUUID();
        const event = await EventFactory.create(eventWithFileRequired);
        const registration = await RegistrationFactory.create({
          event: { connect: { id: event.id } },
        });
        const file = await FileFactory.create({
          field: sessionId,
          accessLevel: 'private',
          registration: { connect: { id: registration.id } },
        });

        const data = {
          some_field: 'Some value',
          some_file: file.id,
        };

        await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .set('Cookie', [
            'session=' + sessionId,
            '__Host-session=' + sessionId,
          ])
          .send({ data })
          .expect(400);
      });
    });

    describe('computed data', () => {
      it('should generate computed data for all fields', async () => {
        const event = await EventFactory.create(eventWithAllEventDataTypes);

        const data = {
          firstName: 'Jhon',
          lastName: 'Doe',
          dateOfBirth: '2000-01-01',
          email: 'test@example.com',
          emailSecondary: 'other@example.com',
          role: 'counselor',
          gender: 'f',
          street: 'Somestreet 1',
          city: 'Somecity',
          zipCode: '12356',
          country: 'de',
        };

        const { body } = await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .send({ data })
          .expect(201);

        expect(body).toHaveProperty('data.computedData');
        expect(body.data.computedData).toEqual({
          firstName: 'Jhon',
          lastName: 'Doe',
          dateOfBirth: '2000-01-01',
          emails: ['test@example.com', 'other@example.com'],
          role: 'counselor',
          gender: 'f',
          address: {
            street: 'Somestreet 1',
            city: 'Somecity',
            zipCode: '12356',
            country: 'de',
          },
        });
      });

      it('should generate computed data with address', async () => {
        const event = await EventFactory.create(eventWithAddressEventDataTypes);

        const data = {
          address: {
            address: 'Somestreet 1',
            city: 'Somecity',
            zip_code: '12356',
            country: 'de',
          },
        };

        const { body } = await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .send({ data })
          .expect(201);

        expect(body).toHaveProperty('data.computedData.address');
        expect(body.data.computedData.address).toEqual({
          street: 'Somestreet 1',
          city: 'Somecity',
          zipCode: '12356',
          country: 'de',
        });
      });
    });

    describe('waiting list', () => {
      const assertRegistration = async (
        eventId: string,
        data: unknown,
        expected: string,
      ) => {
        const { body } = await request()
          .post(`/api/v1/events/${eventId}/registrations`)
          .send({ data })
          .expect(201);

        expect(body).toHaveProperty('data.status', expected);
      };

      it('should set waiting list for national events', async () => {
        const event = await EventFactory.create(
          eventWithMaxParticipantsNational,
        );

        // Fill event
        for (let i = 0; i < 5; i++) {
          await assertRegistration(
            event.id,
            {
              first_name: `Jhon ${i}`,
            },
            'ACCEPTED',
          );
        }

        // Assert waiting list
        await assertRegistration(
          event.id,
          {
            first_name: `Jhon`,
          },
          'WAITLISTED',
        );
      });

      it('should set waiting list for international events', async () => {
        const event = await EventFactory.create(
          eventWithMaxParticipantsInternational,
        );

        // Fill event
        for (let i = 0; i < 5; i++) {
          await assertRegistration(
            event.id,
            {
              first_name: `Jhon ${i}`,
              country: 'de',
            },
            'ACCEPTED',
          );
        }

        // Assert waiting list
        await assertRegistration(
          event.id,
          {
            first_name: `Jhon`,
            country: 'de',
          },
          'WAITLISTED',
        );

        // Other nation should not be on waiting list
        await assertRegistration(
          event.id,
          {
            first_name: `Jhon`,
            country: 'fr',
          },
          'ACCEPTED',
        );
      });

      it('should set waiting list for participants in national events with roles', async () => {
        const event = await EventFactory.create(
          eventWithMaxParticipantsRolesNational,
        );

        // Add a counselor
        await assertRegistration(
          event.id,
          {
            first_name: `Tom`,
            role: 'counselor',
          },
          'ACCEPTED',
        );

        // Fill event
        for (let i = 0; i < 5; i++) {
          await assertRegistration(
            event.id,
            {
              first_name: `Jhon ${i}`,
              role: 'participant',
            },
            'ACCEPTED',
          );
        }

        // Assert waiting list
        await assertRegistration(
          event.id,
          {
            first_name: `Jhon`,
            role: 'participant',
          },
          'WAITLISTED',
        );

        // Check another counselor
        await assertRegistration(
          event.id,
          {
            first_name: `Mary`,
            role: 'counselor',
          },
          'ACCEPTED',
        );
      });

      it('should set waiting list for participants in international events with roles', async () => {
        const event = await EventFactory.create(
          eventWithMaxParticipantsRolesInternational,
        );

        // Add a counselor
        await assertRegistration(
          event.id,
          {
            first_name: `Tom`,
            role: 'counselor',
            country: 'de',
          },
          'ACCEPTED',
        );

        // Fill event
        for (let i = 0; i < 5; i++) {
          await assertRegistration(
            event.id,
            {
              first_name: `Jhon ${i}`,
              role: 'participant',
              country: 'de',
            },
            'ACCEPTED',
          );
        }

        // Assert waiting list
        await assertRegistration(
          event.id,
          {
            first_name: `Jhon`,
            role: 'participant',
            country: 'de',
          },
          'WAITLISTED',
        );

        // Check another counselor
        await assertRegistration(
          event.id,
          {
            first_name: `Mary`,
            role: 'counselor',
            country: 'de',
          },
          'ACCEPTED',
        );

        // Check participant from other nation
        await assertRegistration(
          event.id,
          {
            first_name: `Larry`,
            role: 'participant',
            country: 'fr',
          },
          'ACCEPTED',
        );
      });

      it('should set waiting list when country is provided via address', async () => {
        const event = await EventFactory.create(eventWithAddress);

        // Fill event
        for (let i = 0; i < 5; i++) {
          await assertRegistration(
            event.id,
            {
              first_name: `Jhon ${i}`,
              address: {
                country: 'de',
              },
            },
            'ACCEPTED',
          );
        }

        // Assert waiting list
        await assertRegistration(
          event.id,
          {
            first_name: `Jhon`,
            address: {
              country: 'de',
            },
          },
          'WAITLISTED',
        );

        // Other nation should not be on waiting list
        await assertRegistration(
          event.id,
          {
            first_name: `Jhon`,
            address: {
              country: 'fr',
            },
          },
          'ACCEPTED',
        );
      });

      it('should ignore the waiting list field when set', async () => {
        const event = await EventFactory.create(
          eventWithMaxParticipantsNational,
        );

        // Fill event
        for (let i = 0; i < 5; i++) {
          await request()
            .post(`/api/v1/events/${event.id}/registrations`)
            .send({
              data: { first_name: `Jhon ${i}` },
              status: 'ACCEPTED',
            })
            .expect(201);
        }

        // Assert waiting list
        await assertRegistration(
          event.id,
          {
            first_name: `Jhon`,
          },
          'WAITLISTED',
        );
      });

      it('should respond with `400` status code when event country data is missing for international event', async () => {
        const event = await EventFactory.create(eventWithoutCountryData);

        const data = {
          data: {
            first_name: `Jhon`,
          },
        };

        await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .send(data)
          .expect(400);
      });

      it('should respond with `400` status code when event country data is invalid for international event', async () => {
        const event = await EventFactory.create(eventWithoutCountryData);

        const data = {
          data: {
            first_name: `Jhon`,
            country: 1,
          },
        };

        await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .send(data)
          .expect(400);
      });

      it('should respond with `400` status code when event country data is not matching for international event', async () => {
        const event = await EventFactory.create(eventWithoutCountryData);

        const data = {
          data: {
            first_name: `Jhon`,
            country: 'us',
          },
        };

        await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .send(data)
          .expect(400);
      });
    });

    describe('sends messages', () => {
      const createEventWithTemplates = async (
        data: Partial<Prisma.EventCreateInput>,
      ) => {
        return EventFactory.create({
          ...data,
          messageTemplates: {
            createMany: {
              data: [
                MessageTemplateFactory.build({
                  country: 'fr',
                  trigger: 'registration_submitted',
                  subject: 'Registration received',
                }),
                MessageTemplateFactory.build({
                  trigger: 'registration_confirmed',
                  subject: 'Registration confirmed',
                  country: 'fr',
                }),
                MessageTemplateFactory.build({
                  country: 'fr',
                  trigger: 'registration_waitlisted',
                  subject: 'Registration on waiting list',
                }),
                MessageTemplateFactory.build({
                  country: 'fr',
                  trigger: 'registration_updated',
                  subject: 'Registration updated',
                }),
                MessageTemplateFactory.build({
                  country: 'fr',
                  trigger: 'registration_canceled',
                  subject: 'Registration canceled',
                }),
              ],
            },
          },
        });
      };

      it('should not send a message when message template for group is missing', async () => {
        const event = await EventFactory.create({
          ...eventWithEmailAndCountry,
          messageTemplates: {
            create: MessageTemplateFactory.build({
              trigger: 'registration_confirmed',
              subject: 'Registration confirmed',
              country: 'de',
            }),
          },
        });

        const data = {
          email: 'test@example.com',
          first_name: 'Jhon',
          last_name: 'Doe',
          country: 'fr',
        };

        await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .send({ data })
          .expect(201);
      });

      it('should send a confirmation email to the user with country', async () => {
        const event = await createEventWithTemplates(eventWithEmailAndCountry);

        const data = {
          email: 'test@example.com',
          first_name: 'Jhon',
          last_name: 'Doe',
          country: 'fr',
        };

        await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .send({ data })
          .expect(201);

        expectEmailWith({
          to: data.email,
          replyTo: event.contactEmail as string,
          subject: 'Registration confirmed',
        });
      });

      it('should send a confirmation email to the user without country in national event', async () => {
        const event = await createEventWithTemplates(eventWithEmailAndCountry);

        const data = {
          email: 'test@example.com',
          first_name: 'Jhon',
          last_name: 'Doe',
          country: 'fr',
        };

        await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .send({ data })
          .expect(201);

        expectEmailWith({
          to: data.email,
          replyTo: event.contactEmail as string,
          subject: 'Registration confirmed',
        });
      });

      it('should send a confirmation email to multiple emails', async () => {
        const event = await EventFactory.create(eventWithMultipleEmails);

        const data = {
          email: 'test@example.com',
          emailGuardian: 'guardian@example.com',
          full_name: 'Jhon Doe',
        };

        await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .send({ data })
          .expect(201);

        expectEmailWith({
          to: data.email,
          replyTo: event.contactEmail as string,
        });

        expectEmailWith({
          to: data.emailGuardian,
          replyTo: event.contactEmail as string,
        });
      });

      it('should send a notification to the contact email for national event', async () => {
        const event = await EventFactory.create(eventWithEmailAndCountry);

        const data = {
          email: 'test@example.com',
          first_name: 'Jhon',
          country: 'fr',
        };

        await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .send({ data })
          .expect(201);

        // TODO Assert correct language
        expectEmailWith({
          to: event.contactEmail as string,
          replyTo: expect.arrayContaining([data.email]),
        });
      });

      it('should send a copy to the contact emails for international event', async () => {
        const event = await EventFactory.create(
          eventWithContactEmailInternational,
        );

        const data = {
          country: 'de',
        };

        await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .send({ data })
          .expect(201);

        const expectedEmail =
          eventWithContactEmailInternational.contactEmail.de;
        // TODO Assert correct language
        expectEmailWith({
          to: expectedEmail,
        });
      });

      it('should send a waiting list information to the user', async () => {
        const event = await createEventWithTemplates(
          eventWithEmailAndMaxParticipants,
        );

        const data = {
          email: 'test@example.com',
          country: 'fr',
        };

        await request()
          .post(`/api/v1/events/${event.id}/registrations`)
          .send({ data })
          .expect(201);

        expectEmailWith({
          to: data.email,
          subject: 'Registration on waiting list',
        });
      });
    });
  });

  describe('PATCH /api/v1/events/:eventId/registrations/:registrationId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } = await createEventWithManagerAndToken(
          undefined,
          role,
        );
        const registration = await createRegistration(event);

        await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .send({
            status: 'ACCEPTED',
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);
      },
    );

    it('should respond with `403` status code when user is not event manager', async () => {
      const accessToken = generateAccessToken(await UserFactory.create());
      const event = await EventFactory.create();
      const registration = await createRegistration(event);

      await request()
        .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
        .send({
          data: {},
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const event = await EventFactory.create();
      const registration = await createRegistration(event);

      await request()
        .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
        .send({})
        .expect(401);
    });

    it.todo('should respond with `400` status code when request body is empty');

    it('should respond with `404` status code when registration id does not exists', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const id = ulid();

      await request()
        .patch(`/api/v1/events/${event.id}/registrations/${id}`)
        .send({})
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    describe('files', () => {
      it('should respond with `200` status code when previous form has file', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken(
          eventWithFileRequired,
        );
        const file = await FileFactory.create({
          field: crypto.randomUUID(),
          accessLevel: 'private',
        });
        const registration = await createRegistration(event, {
          data: {
            some_field: 'Test',
            some_file: file.id,
          },
          files: { connect: { id: file.id } },
        });

        const { body } = await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .send({
            data: {
              some_field: 'Test',
              some_file: file.id,
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body.data.data).toHaveProperty('some_field', 'Test');
        expect(body.data.data).toHaveProperty('some_file', file.id);

        const files = await prisma.file.findMany({
          where: {
            registrationId: registration.id,
          },
        });

        expect(files).toHaveLength(1);
        expect(files[0].id).toBe(file.id);
      });

      it('should respond with `200` status code when new file is provided', async () => {
        const sessionId = crypto.randomUUID();
        const { event, accessToken } = await createEventWithManagerAndToken(
          eventWithFileOptional,
        );
        const registration = await createRegistration(event, {
          data: {
            some_field: 'Test',
          },
        });

        const file = await FileFactory.create({
          field: sessionId,
          accessLevel: 'private',
        });

        const { body } = await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .set('Cookie', [
            'session=' + sessionId,
            '__Host-session=' + sessionId,
          ])
          .send({
            data: {
              some_field: 'Test',
              some_file: file.id,
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body.data.data).toHaveProperty('some_field', 'Test');
        expect(body.data.data).toHaveProperty('some_file', file.id);

        const files = await prisma.file.findMany({
          where: {
            registrationId: registration.id,
          },
        });

        expect(files).toHaveLength(1);
        expect(files[0].id).toBe(file.id);
      });

      it('should respond with `200` status code when new file is replaced', async () => {
        const sessionId = crypto.randomUUID();
        const { event, accessToken } = await createEventWithManagerAndToken(
          eventWithFileRequired,
        );
        const oldFile = await FileFactory.create({
          field: crypto.randomUUID(),
          accessLevel: 'private',
        });
        const registration = await createRegistration(event, {
          data: {
            some_field: 'Test',
            some_file: oldFile.id,
          },
          files: { connect: { id: oldFile.id } },
        });
        const file = await FileFactory.create({
          field: sessionId,
          accessLevel: 'private',
        });

        const { body } = await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .set('Cookie', [
            'session=' + sessionId,
            '__Host-session=' + sessionId,
          ])
          .send({
            data: {
              some_field: 'Test',
              some_file: file.id,
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body.data.data).toHaveProperty('some_field', 'Test');
        expect(body.data.data).toHaveProperty('some_file', file.id);

        const files = await prisma.file.findMany({
          where: {
            registrationId: registration.id,
          },
        });

        expect(files).toHaveLength(1);
        expect(files[0].id).toBe(file.id);
      });

      it('should respond with `400` status code when file does not exist', async () => {
        const sessionId = crypto.randomUUID();
        const { event, accessToken } = await createEventWithManagerAndToken(
          eventWithFileOptional,
        );
        const registration = await createRegistration(event, {
          data: {
            some_field: 'Test',
          },
        });

        await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .set('Cookie', [
            'session=' + sessionId,
            '__Host-session=' + sessionId,
          ])
          .send({
            data: {
              some_field: 'Test',
              some_file: ulid(),
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });

      it('should respond with `400` status code when session id does not match', async () => {
        const sessionId = crypto.randomUUID();
        const { event, accessToken } = await createEventWithManagerAndToken(
          eventWithFileOptional,
        );
        const registration = await createRegistration(event, {
          data: {
            some_field: 'Test',
          },
        });

        const file = await FileFactory.create({
          field: crypto.randomUUID(),
          accessLevel: 'private',
        });

        await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .set('Cookie', [
            'session=' + sessionId,
            '__Host-session=' + sessionId,
          ])
          .send({
            data: {
              some_field: 'Test',
              some_file: file.id,
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });

      it('should respond with `400` status code when file is already assigned', async () => {
        const sessionId = crypto.randomUUID();
        const { event, accessToken } = await createEventWithManagerAndToken(
          eventWithFileOptional,
        );
        const registration = await createRegistration(event, {
          data: {
            some_field: 'Test',
          },
        });

        const file = await FileFactory.create({
          field: sessionId,
          accessLevel: 'private',
          registration: {
            create: RegistrationFactory.build({
              event: { create: EventFactory.build() },
            }),
          },
        });

        await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .set('Cookie', [
            'session=' + sessionId,
            '__Host-session=' + sessionId,
          ])
          .send({
            data: {
              some_field: 'Test',
              some_file: file.id,
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });
    });

    describe('sends messages', () => {
      it('should respond with `200` status code when message template is missing', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken({
          ...eventWithEmail,
          messageTemplates: {},
        });
        const registration = await createRegistration(event);

        const data = {
          email: 'test@example.com',
          first_name: 'Jhon',
          last_name: 'Doe',
        };

        await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .send({ data })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);
      });

      it('should send update email', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken({
          ...eventWithEmail,
          messageTemplates: {
            create: MessageTemplateFactory.build({
              trigger: 'registration_updated',
              subject: 'Registration updated',
            }),
          },
        });
        const registration = await createRegistration(event);

        const data = {
          email: 'test@example.com',
          first_name: 'Jhon',
          last_name: 'Doe',
        };

        await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .send({ data })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expectEmailWith({
          to: data.email,
          replyTo: event.contactEmail as string,
          subject: 'Registration updated',
        });
      });

      it('should list the changed fields with their new values', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken({
          ...eventWithEmail,
          messageTemplates: {
            create: MessageTemplateFactory.build({
              trigger: 'registration_updated',
              subject: 'Registration updated',
              body: '<p>{{ registration.changes }}</p>',
            }),
          },
        });
        const registration = await createRegistration(event);

        const data = {
          email: 'test@example.com',
          first_name: 'Jhon',
          last_name: 'Doe',
        };

        await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .send({ data })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expectEmailWith({
          html: expect.stringContaining(
            '<ul class="registration-changes"',
          ) as string,
        });
        expectEmailWith({
          html: expect.stringContaining('Jhon') as string,
        });

        // The durable copy names what moved without repeating what it now says.
        const delivery = await prisma.messageDelivery.findFirst({
          where: { registrationId: registration.id },
        });
        expect(delivery?.body).toContain('first_name');
        expect(delivery?.body).not.toContain('Jhon');
      });

      it('should not add a change list when the template has no token', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken({
          ...eventWithEmail,
          messageTemplates: {
            create: MessageTemplateFactory.build({
              trigger: 'registration_updated',
              subject: 'Registration updated',
              body: '<p>Your registration was updated.</p>',
            }),
          },
        });
        const registration = await createRegistration(event);

        await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .send({ data: { email: 'test@example.com', first_name: 'Jhon' } })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expectEmailWith({
          html: expect.not.stringContaining(
            '<ul class="registration-changes"',
          ) as string,
        });
      });

      it('should not send update email when suppressed', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken({
          ...eventWithEmail,
          messageTemplates: {
            create: MessageTemplateFactory.build({
              trigger: 'registration_updated',
              country: 'fr',
              subject: 'Registration updated',
            }),
          },
        });
        const registration = await createRegistration(event, {
          country: 'bg',
        });

        const data = {
          email: 'test@example.com',
          first_name: 'Jhon',
          last_name: 'Doe',
        };

        await request()
          .patch(
            `/api/v1/events/${event.id}/registrations/${registration.id}?suppressMessage=true`,
          )
          .send({ data })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expectEmailCount(0);
      });

      it('should send waiting list confirmation', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken({
          ...eventWithEmailAndCountry,
          messageTemplates: {
            create: MessageTemplateFactory.build({
              trigger: 'registration_waitlist_accepted',
              country: 'fr',
              subject: 'Registration accepted',
            }),
          },
        });
        const registration = await createRegistration(event, {
          status: 'WAITLISTED',
          country: 'fr',
        });

        const data = {
          email: 'test@example.com',
          first_name: 'Jhon',
          last_name: 'Doe',
          country: 'fr',
        };

        await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .send({
            status: 'ACCEPTED',
            data,
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expectEmailCount(1);
        expectEmailWith({
          to: data.email,
          replyTo: event.contactEmail as string,
          subject: 'Registration accepted',
        });
      });
    });

    describe('computed data', () => {
      it('should generate computed data for all fields', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken(
          eventWithAllEventDataTypes,
        );
        const registration = await createRegistration(event);

        const data = {
          firstName: 'Jhon',
          lastName: 'Doe',
          dateOfBirth: '2000-01-01',
          email: 'test@example.com',
          emailSecondary: 'other@example.com',
          role: 'counselor',
          gender: 'f',
          street: 'Somestreet 1',
          city: 'Somecity',
          zipCode: '12356',
          country: 'de',
        };

        const { body } = await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .send({ data })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body).toHaveProperty('data.computedData');
        expect(body.data.computedData).toEqual({
          firstName: 'Jhon',
          lastName: 'Doe',
          dateOfBirth: '2000-01-01',
          emails: ['test@example.com', 'other@example.com'],
          role: 'counselor',
          gender: 'f',
          address: {
            street: 'Somestreet 1',
            city: 'Somecity',
            zipCode: '12356',
            country: 'de',
          },
        });
      });

      it('should generate computed data with address', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken(
          eventWithAddressEventDataTypes,
        );
        const registration = await createRegistration(event);

        const data = {
          address: {
            address: 'Somestreet 1',
            city: 'Somecity',
            zip_code: '12356',
            country: 'de',
          },
        };

        const { body } = await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .send({ data })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body).toHaveProperty('data.computedData.address');
        expect(body.data.computedData.address).toEqual({
          street: 'Somestreet 1',
          city: 'Somecity',
          zipCode: '12356',
          country: 'de',
        });
      });
    });

    describe('custom data', () => {
      it('should respond with `200` status code when custom data is present', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken(
          undefined,
          'DIRECTOR',
        );
        const registration = await createRegistration(event);

        const customData = {
          someKey: 'someValue',
          anotherKey: 123,
        };

        const { body } = await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .send({
            customData,
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body).toHaveProperty('data.customData', {
          someKey: 'someValue',
          anotherKey: 123,
        });
      });

      it('should respond with `200` status code when custom data is overwritten', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken(
          undefined,
          'DIRECTOR',
        );
        const registration = await createRegistration(event);

        const customData = {
          someKey: 'someValue',
          anotherKey: 123,
        };

        await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .send({
            customData,
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        const updatedCustomData = {
          someKey: 'newValue',
        };

        const { body } = await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .send({
            customData: updatedCustomData,
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body).toHaveProperty('data.customData', {
          someKey: 'newValue',
        });
      });

      it('should respond with `400` status code when custom data is invalid', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken(
          undefined,
          'DIRECTOR',
        );
        const registration = await createRegistration(event);

        const customData = 'Invalid custom data';

        await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .send({
            customData,
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });
    });

    describe('custom files', () => {
      const sessionCookies = (sessionId: string) => [
        'session=' + sessionId,
        '__Host-session=' + sessionId,
      ];

      it('should attach a temp file of the same session to a slot', async () => {
        const sessionId = crypto.randomUUID();
        const { event, accessToken } = await createEventWithManagerAndToken();
        const registration = await createRegistration(event);

        const file = await FileFactory.create({
          field: sessionId,
          accessLevel: 'private',
        });

        const { body } = await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .set('Cookie', sessionCookies(sessionId))
          .send({
            customFiles: {
              consent_form: file.id,
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body).toHaveProperty('data.customFiles', {
          consent_form: file.id,
        });

        const updatedFile = await prisma.file.findUniqueOrThrow({
          where: { id: file.id },
        });
        expect(updatedFile.registrationId).toBe(registration.id);
        expect(updatedFile.field).toBe('custom:consent_form');
      });

      it('should detach the previous file when the slot is replaced', async () => {
        const sessionId = crypto.randomUUID();
        const { event, accessToken } = await createEventWithManagerAndToken();
        const registration = await createRegistration(event);

        const oldFile = await FileFactory.create({
          field: 'custom:consent_form',
          accessLevel: 'private',
          registration: { connect: { id: registration.id } },
        });
        const file = await FileFactory.create({
          field: sessionId,
          accessLevel: 'private',
        });

        const { body } = await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .set('Cookie', sessionCookies(sessionId))
          .send({
            customFiles: {
              consent_form: file.id,
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body).toHaveProperty('data.customFiles', {
          consent_form: file.id,
        });

        const updatedOldFile = await prisma.file.findUniqueOrThrow({
          where: { id: oldFile.id },
        });
        expect(updatedOldFile.registrationId).toBeNull();
        expect(updatedOldFile.field).toBeNull();

        const updatedFile = await prisma.file.findUniqueOrThrow({
          where: { id: file.id },
        });
        expect(updatedFile.registrationId).toBe(registration.id);
        expect(updatedFile.field).toBe('custom:consent_form');
      });

      it('should detach the file when the slot is cleared', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken();
        const registration = await createRegistration(event);

        const file = await FileFactory.create({
          field: 'custom:consent_form',
          accessLevel: 'private',
          registration: { connect: { id: registration.id } },
        });

        const { body } = await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .send({
            customFiles: {
              consent_form: null,
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body).toHaveProperty('data.customFiles', {});

        const updatedFile = await prisma.file.findUniqueOrThrow({
          where: { id: file.id },
        });
        expect(updatedFile.registrationId).toBeNull();
        expect(updatedFile.field).toBeNull();
      });

      it('should keep the file when the slot is re-assigned to it', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken();
        const registration = await createRegistration(event);

        const file = await FileFactory.create({
          field: 'custom:consent_form',
          accessLevel: 'private',
          registration: { connect: { id: registration.id } },
        });

        const { body } = await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .send({
            customFiles: {
              consent_form: file.id,
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body).toHaveProperty('data.customFiles', {
          consent_form: file.id,
        });

        const updatedFile = await prisma.file.findUniqueOrThrow({
          where: { id: file.id },
        });
        expect(updatedFile.registrationId).toBe(registration.id);
        expect(updatedFile.field).toBe('custom:consent_form');
      });

      it('should only change the mentioned slots', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken();
        const registration = await createRegistration(event);

        const otherFile = await FileFactory.create({
          field: 'custom:payment_receipt',
          accessLevel: 'private',
          registration: { connect: { id: registration.id } },
        });
        const file = await FileFactory.create({
          field: 'custom:consent_form',
          accessLevel: 'private',
          registration: { connect: { id: registration.id } },
        });

        const { body } = await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .send({
            customFiles: {
              consent_form: null,
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body).toHaveProperty('data.customFiles', {
          payment_receipt: otherFile.id,
        });

        const unchangedFile = await prisma.file.findUniqueOrThrow({
          where: { id: otherFile.id },
        });
        expect(unchangedFile.registrationId).toBe(registration.id);
        expect(unchangedFile.field).toBe('custom:payment_receipt');

        const removedFile = await prisma.file.findUniqueOrThrow({
          where: { id: file.id },
        });
        expect(removedFile.registrationId).toBeNull();
      });

      it('should respond with `400` status code when the session id does not match', async () => {
        const sessionId = crypto.randomUUID();
        const { event, accessToken } = await createEventWithManagerAndToken();
        const registration = await createRegistration(event);

        const file = await FileFactory.create({
          field: crypto.randomUUID(),
          accessLevel: 'private',
        });

        await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .set('Cookie', sessionCookies(sessionId))
          .send({
            customFiles: {
              consent_form: file.id,
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(400);

        const unchangedFile = await prisma.file.findUniqueOrThrow({
          where: { id: file.id },
        });
        expect(unchangedFile.registrationId).toBeNull();
      });

      it('should respond with `400` status code when the file does not exist', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken();
        const registration = await createRegistration(event);

        await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .send({
            customFiles: {
              consent_form: ulid(),
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });

      it('should respond with `400` status code when a form file is referenced', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken(
          eventWithFileOptional,
        );
        const formFile = await FileFactory.create({
          field: crypto.randomUUID(),
          accessLevel: 'private',
        });
        const registration = await createRegistration(event, {
          data: {
            some_field: 'Test',
            some_file: formFile.id,
          },
          files: { connect: { id: formFile.id } },
        });

        await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .send({
            customFiles: {
              consent_form: formFile.id,
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(400);

        const unchangedFile = await prisma.file.findUniqueOrThrow({
          where: { id: formFile.id },
        });
        expect(unchangedFile.registrationId).toBe(registration.id);
        expect(unchangedFile.field).not.toBe('custom:consent_form');
      });

      it.each([
        ['a slot name with a dot', { 'consent.form': null }],
        ['a slot name with a space', { 'consent form': null }],
        ['a non-ULID file id', { consent_form: 'not-a-file-id' }],
        ['a non-object value', 'consent_form'],
      ])(
        'should respond with `400` status code for %s',
        async (_name, customFiles) => {
          const { event, accessToken } = await createEventWithManagerAndToken();
          const registration = await createRegistration(event);

          await request()
            .patch(
              `/api/v1/events/${event.id}/registrations/${registration.id}`,
            )
            .send({ customFiles })
            .auth(accessToken, { type: 'bearer' })
            .expect(400);
        },
      );

      it('should keep custom files when form data is updated', async () => {
        const sessionId = crypto.randomUUID();
        const { event, accessToken } = await createEventWithManagerAndToken(
          eventWithFileOptional,
        );
        const registration = await createRegistration(event, {
          data: {
            some_field: 'Test',
          },
        });

        const customFile = await FileFactory.create({
          field: 'custom:consent_form',
          accessLevel: 'private',
          registration: { connect: { id: registration.id } },
        });

        await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .set('Cookie', sessionCookies(sessionId))
          .send({
            data: {
              some_field: 'Updated',
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        const unchangedFile = await prisma.file.findUniqueOrThrow({
          where: { id: customFile.id },
        });
        expect(unchangedFile.registrationId).toBe(registration.id);
        expect(unchangedFile.field).toBe('custom:consent_form');
      });

      it('should keep form files when custom files are updated', async () => {
        const sessionId = crypto.randomUUID();
        const { event, accessToken } = await createEventWithManagerAndToken(
          eventWithFileOptional,
        );
        const formFile = await FileFactory.create({
          field: crypto.randomUUID(),
          accessLevel: 'private',
        });
        const registration = await createRegistration(event, {
          data: {
            some_field: 'Test',
            some_file: formFile.id,
          },
          files: { connect: { id: formFile.id } },
        });
        const file = await FileFactory.create({
          field: sessionId,
          accessLevel: 'private',
        });

        await request()
          .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .set('Cookie', sessionCookies(sessionId))
          .send({
            customFiles: {
              consent_form: file.id,
            },
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        const unchangedFile = await prisma.file.findUniqueOrThrow({
          where: { id: formFile.id },
        });
        expect(unchangedFile.registrationId).toBe(registration.id);
      });

      it('should include the file slots in the show response', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken();
        const registration = await createRegistration(event);

        const file = await FileFactory.create({
          field: 'custom:consent_form',
          accessLevel: 'private',
          registration: { connect: { id: registration.id } },
        });

        const { body } = await request()
          .get(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body).toHaveProperty('data.customFiles', {
          consent_form: file.id,
        });
      });
    });
  });

  describe('DELETE /api/v1/events/:eventId/registrations/:registrationId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 204, expectedCount: 1 },
      { role: 'COORDINATOR', expectedStatus: 204, expectedCount: 1 },
      { role: 'COUNSELOR', expectedStatus: 403, expectedCount: 2 },
      { role: 'VIEWER', expectedStatus: 403, expectedCount: 2 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus, expectedCount }) => {
        const { event, accessToken } = await createEventWithManagerAndToken(
          undefined,
          role,
        );
        await createRegistration(event);
        const registration = await createRegistration(event);

        await request()
          .delete(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        const registrationCount = await prisma.registration.count({
          where: {
            eventId: event.id,
          },
        });
        expect(registrationCount).toBe(expectedCount);
      },
    );

    it('should delete the mails rendered for the registration', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const registration = await createRegistration(event);
      await MessageDeliveryFactory.create({
        registration: { connect: { id: registration.id } },
      });

      await request()
        .delete(`/api/v1/events/${event.id}/registrations/${registration.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      // Erasing a participant erases what was mailed about them; a delivery row
      // that outlived its registration used to keep their data indefinitely.
      const deliveries = await prisma.messageDelivery.count();
      expect(deliveries).toBe(0);
    });

    it('should respond with `403` status code when user is not event manager', async () => {
      const event = await EventFactory.create();
      const registration = await createRegistration(event);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .delete(`/api/v1/events/${event.id}/registrations/${registration.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const registrationCount = await countRegistrations(event);
      expect(registrationCount).toBe(1);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const event = await EventFactory.create();
      const registration = await createRegistration(event);

      await request()
        .delete(`/api/v1/events/${event.id}/registrations/${registration.id}`)
        .send()
        .expect(401);

      const registrationCount = await countRegistrations(event);
      expect(registrationCount).toBe(1);
    });

    it('should respond with `401` status code when unauthenticated and registration does not exist', async () => {
      const event = await EventFactory.create();
      const registrationId = ulid();

      await request()
        .delete(`/api/v1/events/${event.id}/registrations/${registrationId}`)
        .send()
        .expect(401);
    });

    describe('sends messages', () => {
      it('should respond with `204` status code when message template is missing', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken({
          messageTemplates: {},
        });
        const registration = await RegistrationFactory.create({
          event: { connect: { id: event.id } },
          emails: ['test@email.com'],
        });

        await request()
          .delete(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(204);
      });

      it('should send update email', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken({
          ...eventWithEmail,
          messageTemplates: {
            createMany: {
              data: [
                MessageTemplateFactory.build({
                  trigger: 'registration_canceled',
                  country: 'us',
                  subject: 'Oops',
                }),
                MessageTemplateFactory.build({
                  trigger: 'registration_canceled',
                  country: 'fr',
                  subject: 'Registration canceled',
                }),
              ],
            },
          },
        });
        const registration = await RegistrationFactory.create({
          event: { connect: { id: event.id } },
          emails: ['test@email.com'],
          country: 'fr',
        });
        await request()
          .delete(`/api/v1/events/${event.id}/registrations/${registration.id}`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(204);

        expect(mailer.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'test@email.com',
            replyTo: event.contactEmail,
            subject: 'Registration canceled',
          }),
        );
      });

      it('should send update email when not suppressed', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken({
          ...eventWithEmail,
          messageTemplates: {
            createMany: {
              data: [
                MessageTemplateFactory.build({
                  trigger: 'registration_canceled',
                  country: 'us',
                  subject: 'Oops',
                }),
                MessageTemplateFactory.build({
                  trigger: 'registration_canceled',
                  country: 'fr',
                  subject: 'Registration canceled',
                }),
              ],
            },
          },
        });
        const registration = await RegistrationFactory.create({
          event: { connect: { id: event.id } },
          emails: ['test@email.com'],
          country: 'fr',
        });
        await request()
          .delete(
            `/api/v1/events/${event.id}/registrations/${registration.id}?suppressMessage=false`,
          )
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(204);

        expect(mailer.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'test@email.com',
            replyTo: event.contactEmail,
            subject: 'Registration canceled',
          }),
        );
      });

      it('should not send email when suppressed', async () => {
        const { event, accessToken } = await createEventWithManagerAndToken({
          ...eventWithEmail,
          messageTemplates: {
            create: MessageTemplateFactory.build({
              trigger: 'registration_canceled',
              subject: 'Registration canceled',
              country: 'fr',
            }),
          },
        });
        const registration = await RegistrationFactory.create({
          event: { connect: { id: event.id } },
          emails: ['test@email.com'],
          country: 'fr',
        });
        await request()
          .delete(
            `/api/v1/events/${event.id}/registrations/${registration.id}?suppressMessage=true`,
          )
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(204);

        expect(mailer.sendMail).not.toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'test@email.com',
            replyTo: event.contactEmail,
            subject: 'Registration canceled',
          }),
        );
      });
    });
  });
});

describe('/api/v1/files/', () => {
  describe('GET /api/v1/files/:fileId', () => {
    it('should respond with `200` status code when user is event manager', async () => {
      const { file, accessToken } = await createRegistrationWithFile();

      await request()
        .get(`/api/v1/files/${file.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
    });

    it('should respond with `403` status code when user is not event manager', async () => {
      const { file } = await createRegistrationWithFile();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/files/${file.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const { file } = await createRegistrationWithFile();

      await request().get(`/api/v1/files/${file.id}`).send().expect(401);
    });

    it('should respond with `404` status code when file id does not exists', async () => {
      const fileId = ulid();

      await request().get(`/api/v1/files/${fileId}`).send().expect(404);
    });
  });
});
