import { describe, expect, it } from 'vitest';
import {
  CampFactory,
  CampManagerFactory,
  RegistrationFactory,
  UserFactory,
  MessageFactory,
  MessageDeliveryFactory,
  MessageTemplateFactory,
  FileFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import { ulid } from 'ulidx';
import prisma from '../utils/prisma.js';
import { messageCreateBody } from './fixtures/message.fixture.js';
import crypto from 'crypto';
import { uploadFile } from './utils/file.js';
import { expectEmailCount, expectEmailWith } from '../utils/mail.js';
import { Registration, Message, User } from '#generated/prisma/client';
import Handlebars from 'handlebars';

// The message body and subject are rendered with Handlebars, which HTML-escapes
// interpolated values (e.g. `'` -> `&#x27;`, `&` -> `&amp;`). Faker-generated
// fields such as the company name can contain those characters, so expected
// values must be escaped the same way to avoid flaky comparisons.
const esc = (value: unknown): string =>
  Handlebars.escapeExpression(String(value));

const crateCampWithManager = async (
  campCreateData?: Parameters<(typeof CampFactory)['create']>[0],
  role = 'DIRECTOR',
) => {
  const user = await UserFactory.create();
  const accessToken = generateAccessToken(user);

  const camp = await CampFactory.create(campCreateData);
  await CampManagerFactory.create({
    user: { connect: { id: user.id } },
    camp: { connect: { id: camp.id } },
    role,
  });

  return { user, accessToken, camp };
};

const createMessageForCamp = async (campId: string, userId?: string) => {
  const message = await MessageFactory.create({
    camp: { connect: { id: campId } },
    sentBy: { connect: { id: userId } },
  });

  return { message };
};

const createSentMessageForCamp = async (campId: string) => {
  const message = await MessageFactory.create({
    camp: { connect: { id: campId } },
  });
  const registration = await RegistrationFactory.create({
    camp: { connect: { id: campId } },
  });
  const delivery = await MessageDeliveryFactory.create({
    message: { connect: { id: message.id } },
    registration: { connect: { id: registration.id } },
    to: 'recipient@example.com',
  });

  return { message, delivery, registration };
};

const assertMessageResource = (data: unknown, actual: Message, user: User) => {
  expect(data).toStrictEqual({
    id: actual.id,
    subject: actual.subject,
    body: actual.body,
    priority: actual.priority,
    replyTo: actual.replyTo ?? null,
    attachments: [],
    recipients: [],
    sentBy: {
      id: user.id,
      name: user.name,
    },
    createdAt: actual.createdAt.toISOString(),
  });
};

describe('/api/v1/camps/:campId/messages', () => {
  const createCampWithDifferentManager = async () => {
    const user = await UserFactory.create();
    // Manager with wrong camp but correct user
    await CampManagerFactory.create({
      user: { connect: { id: user.id } },
      camp: { create: CampFactory.build() },
    });
    const camp = await CampFactory.create();
    // Manager with correct camp but wrong user
    await CampManagerFactory.create({
      user: { create: UserFactory.build() },
      camp: { connect: { id: camp.id } },
    });
    const accessToken = generateAccessToken(user);

    return { user, accessToken, camp };
  };

  describe.todo('POST /api/v1/camps/:campId/messages/:messageId/resend');

  describe('POST /api/v1/camps/:campId/messages/', () => {
    const assertMessages = async (
      messageId: string,
      expected: {
        body: string;
        subject: string;
        priority: string;
        emails: string[];
        replyTo: string | string[];
      }[],
    ) => {
      const emailCount = expected.reduce((acc, curr) => {
        return acc + curr.emails.length;
      }, 0);

      expectEmailCount(emailCount);

      for (const entry of expected) {
        for (const email of entry.emails) {
          const models = await prisma.messageDelivery.findMany({
            where: {
              messageId,
              to: email,
            },
          });

          expect(models).toHaveLength(1);

          const model = models[0];
          expect(model).toBeDefined();
          expect(model).toHaveProperty('subject', entry.subject);
          expect(model).toHaveProperty(
            'body',
            expect.stringContaining(entry.body),
          );
          expect(model).toHaveProperty('priority', entry.priority);

          expectEmailWith({
            to: email,
            subject: expect.stringContaining(entry.subject),
            html: expect.stringContaining(entry.body),
            replyTo: entry.replyTo,
            priority: entry.priority as 'high' | 'normal' | 'low',
          });
        }
      }
    };

    it('should respond with `201` status code', async () => {
      const { user, camp, accessToken } = await crateCampWithManager();

      const registrationA = await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        data: {
          first_name: 'Max',
        },
        emails: ['test@example.com'],
        country: 'de',
      });

      const registrationB = await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        data: {
          first_name: 'Tom',
        },
        emails: ['mail1@example.com', 'mail2@example.com'],
      });

      const data = {
        registrationIds: [registrationA.id, registrationB.id],
        subject:
          'Hi, {{ registration.data.first_name }}, welcome to {{ camp.name }}',
        body:
          'Hello {{ registration.data.first_name }}, the min age is {{ camp.minAge }}. {{ camp.maxAge }} ' +
          '{{ camp.maxParticipants }} {{ camp.location }} {{ camp.organizer }} {{ camp.price }}',
        priority: 'high',
      };

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/messages`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data?.subject).toBe(data.subject);
      expect(body.data?.body).toBe(data.body);
      expect(body.data?.priority).toBe(data.priority);
      expect(body.data?.sentBy).toStrictEqual({ id: user.id, name: user.name });

      // The sender is persisted on the message row.
      const stored = await prisma.message.findUnique({
        where: { id: body.data.id },
      });
      expect(stored?.sentByUserId).toBe(user.id);

      await assertMessages(body.data.id, [
        {
          subject: `Hi, ${esc(registrationA.data.first_name)}, welcome to ${esc(camp.name as string)}`,
          body:
            `Hello ${esc(registrationA.data.first_name)}, the min age is ${esc(camp.minAge)}. ` +
            `${esc(camp.maxAge)} ${esc(camp.maxParticipants as number)} ${esc(camp.location as string)} ${esc(camp.organizer as string)} ${esc(camp.price)}`,
          priority: 'high',
          replyTo: camp.contactEmail as string,
          emails: registrationA.emails!,
        },
        {
          subject: `Hi, ${esc(registrationB.data.first_name)}, welcome to ${esc(camp.name as string)}`,
          body:
            `Hello ${esc(registrationB.data.first_name)}, the min age is ${esc(camp.minAge)}. ` +
            `${esc(camp.maxAge)} ${esc(camp.maxParticipants as number)} ${esc(camp.location as string)} ${esc(camp.organizer as string)} ${esc(camp.price)}`,
          priority: 'high',
          replyTo: camp.contactEmail as string,
          emails: registrationB.emails!,
        },
      ]);
    });

    it('should respond with `201` status code with translated camp fields', async () => {
      const { camp, accessToken } = await crateCampWithManager({
        countries: ['de', 'fr'],
        name: { de: 'Test Camp DE', fr: 'Test Camp FR' },
        organizer: { de: 'Organizer DE', fr: 'Organizer FR' },
        location: { de: 'Location DE', fr: 'Location FR' },
        contactEmail: { de: 'de@email.com', fr: 'fr@email.com' },
        maxParticipants: { de: 8, fr: 9 },
      });

      const registrationA = await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        data: {
          first_name: 'Max',
        },
        emails: ['test@example.com'],
        country: 'de',
      });

      const registrationB = await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        data: {
          first_name: 'Tom',
        },
        emails: ['mail1@example.com', 'mail2@example.com'],
        country: 'fr',
      });

      const registrationC = await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        data: {
          first_name: 'Paula',
        },
        emails: ['some@example.com'],
        country: undefined,
      });

      const data = {
        registrationIds: [registrationA.id, registrationB.id, registrationC.id],
        subject:
          'Hi, {{ registration.data.first_name  }}, welcome to {{ camp.name }}',
        body:
          'Hello {{ registration.data.first_name  }}, {{ camp.organizer }} ' +
          '{{ camp.location }} {{ camp.maxParticipants }}',
      };

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/messages`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      const campAttribute = <T extends string | number>(
        attr: T | Record<string, T> | null,
        locale: string,
      ): T => {
        if (typeof attr !== 'object' || attr === null) {
          throw new Error('Expected attribute to be an object');
        }
        return attr[locale];
      };

      const createExpectedResult = (
        registration: Registration,
        locale: string,
      ) => ({
        subject: `Hi, ${esc(registration.data.first_name)}, welcome to ${esc(campAttribute(camp.name, locale))}`,
        body: `Hello ${esc(registration.data.first_name)}, ${esc(campAttribute(camp.organizer, locale))} ${esc(campAttribute(camp.location, locale))} ${esc(campAttribute(camp.maxParticipants, locale))}`,
        priority: 'normal',
        replyTo: campAttribute(camp.contactEmail, locale),
        emails: registration.emails!,
      });

      await assertMessages(body.data.id, [
        createExpectedResult(registrationA, 'de'),
        createExpectedResult(registrationB, 'fr'),
        createExpectedResult(registrationC, 'de'),
      ]);
    });

    it('should respond with `201` status code with attachments', async () => {
      const sessionId = crypto.randomUUID();
      const { camp, accessToken } = await crateCampWithManager({
        countries: ['de', 'fr'],
        name: { de: 'Test Camp DE', fr: 'Test Camp FR' },
        organizer: { de: 'Organizer DE', fr: 'Organizer FR' },
        location: { de: 'Location DE', fr: 'Location FR' },
        contactEmail: { de: 'de@email.com', fr: 'fr@email.com' },
        maxParticipants: { de: 8, fr: 9 },
      });

      const file1Name = crypto.randomUUID() + '.pdf';
      const file2Name = crypto.randomUUID() + '.pdf';
      await uploadFile('blank.pdf', file1Name);
      await uploadFile('blank.pdf', file2Name);

      const file1 = await FileFactory.create({
        field: sessionId,
        name: file1Name,
      });
      const file2 = await FileFactory.create({
        field: sessionId,
        name: file2Name,
      });

      const registration = await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        data: {
          first_name: 'Max',
        },
        emails: ['test@example.com'],
        country: 'de',
      });

      const data = {
        registrationIds: [registration.id],
        subject:
          'Hi, {{ registration.data.first_name  }}, welcome to {{ camp.name }}',
        body:
          'Hello {{ registration.data.first_name  }}, {{ camp.organizer }} ' +
          '{{ camp.location }} {{ camp.maxParticipants }}',
        attachmentIds: [file1.id, file2.id],
      };

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/messages`)
        .send(data)
        .setSessionId(sessionId)
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data).toHaveProperty('attachments');
      expect(body.data.attachments).toHaveLength(2);

      const files = await prisma.file.findMany({
        where: {
          messageDelivery: {
            messageId: body.data.id,
          },
        },
      });

      expect(files.length).toBe(2);

      expectEmailWith({
        to: 'test@example.com',
      });
    });

    it('should respond with `400` status code with invalid attachments', async () => {
      const sessionId = crypto.randomUUID();
      const { camp, accessToken } = await crateCampWithManager({
        countries: ['de', 'fr'],
        name: { de: 'Test Camp DE', fr: 'Test Camp FR' },
        organizer: { de: 'Organizer DE', fr: 'Organizer FR' },
        location: { de: 'Location DE', fr: 'Location FR' },
        contactEmail: { de: 'de@email.com', fr: 'fr@email.com' },
        maxParticipants: { de: 8, fr: 9 },
      });

      const file1 = await FileFactory.create({
        field: crypto.randomUUID(),
      });
      const file2 = await FileFactory.create({
        field: sessionId,
      });

      const registration = await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        data: {
          first_name: 'Max',
        },
        emails: ['test@example.com'],
        country: 'de',
      });

      const data = {
        registrationIds: [registration.id],
        subject:
          'Hi, {{ registration.data.first_name  }}, welcome to {{ camp.name }}',
        body:
          'Hello {{ registration.data.first_name  }}, {{ camp.organizer }} ' +
          '{{ camp.location }} {{ camp.maxParticipants }}',
        attachmentIds: [file1.id, file2.id],
      };

      await request()
        .post(`/api/v1/camps/${camp.id}/messages`)
        .send(data)
        .setSessionId(sessionId)
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it.each(messageCreateBody)(
      'should respond with `$expected` status code when $name',
      async ({ data, expected }) => {
        const { camp, accessToken } = await crateCampWithManager();
        const registration = await RegistrationFactory.create({
          camp: { connect: { id: camp.id } },
        });

        // Set real registration id
        if (
          'registrationIds' in data &&
          Array.isArray(data.registrationIds) &&
          data.registrationIds.length > 0
        ) {
          data.registrationIds[0] = registration.id;
        }

        await request()
          .post(`/api/v1/camps/${camp.id}/messages`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(expected);
      },
    );

    it('should respond with `400` status code when a registration does not exist', async () => {
      const { camp, accessToken } = await crateCampWithManager();

      const registration = await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        data: {
          first_name: 'Max',
        },
        emails: ['test@example.com'],
      });

      const data = {
        registrationIds: [registration.id, ulid()],
        subject: 'Subject',
        body: 'Body',
      };

      await request()
        .post(`/api/v1/camps/${camp.id}/messages`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it.each([
      { role: 'DIRECTOR', expectedStatus: 201 },
      { role: 'COORDINATOR', expectedStatus: 201 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await crateCampWithManager(
          undefined,
          role,
        );
        const registration = await RegistrationFactory.create({
          camp: { connect: { id: camp.id } },
          emails: ['test@example.com'],
        });

        const data = {
          registrationIds: [registration.id],
          subject: 'Test Subject',
          body: 'Test Body',
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/messages`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);
      },
    );

    it('should respond with `403` status code when user is not camp manager', async () => {
      const { camp, accessToken } = await createCampWithDifferentManager();

      await request()
        .post(`/api/v1/camps/${camp.id}/messages`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();

      await request()
        .post(`/api/v1/camps/${camp.id}/messages`)
        .send()
        .expect(401);
    });
  });

  describe('GET /api/v1/camps/:campId/messages/', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await crateCampWithManager(
          undefined,
          role,
        );

        await request()
          .get(`/api/v1/camps/${camp.id}/messages`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);
      },
    );

    it('should only return sent messages, not automated event templates', async () => {
      const { camp, accessToken } = await crateCampWithManager();
      const { message } = await createSentMessageForCamp(camp.id);
      // An automated event template lives in a different table and must not
      // surface here.
      await MessageTemplateFactory.create({
        camp: { connect: { id: camp.id } },
        event: 'registration_confirmed',
      });

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/messages`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toHaveProperty('id', message.id);
      expect(body.data[0]).toHaveProperty('recipients');
      expect(body.data[0].recipients).toHaveLength(1);
    });

    it('should collapse multiple deliveries for the same registration into one recipient', async () => {
      const { camp, accessToken } = await crateCampWithManager();
      const message = await MessageFactory.create({
        camp: { connect: { id: camp.id } },
      });
      const registration = await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
      });
      // Two delivery rows (e.g. one per email address) for the same
      // registration must surface as a single recipient.
      await MessageDeliveryFactory.create({
        message: { connect: { id: message.id } },
        registration: { connect: { id: registration.id } },
        to: 'first@example.com',
      });
      await MessageDeliveryFactory.create({
        message: { connect: { id: message.id } },
        registration: { connect: { id: registration.id } },
        to: 'second@example.com',
      });
      // A delivery no longer linked to a registration must be dropped entirely.
      await MessageDeliveryFactory.create({
        message: { connect: { id: message.id } },
        to: 'orphan@example.com',
      });

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/messages`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0].recipients).toHaveLength(1);
      expect(body.data[0].recipients[0]).toHaveProperty(
        'registrationId',
        registration.id,
      );
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const { camp, accessToken } = await createCampWithDifferentManager();

      await request()
        .get(`/api/v1/camps/${camp.id}/messages`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();

      await request()
        .get(`/api/v1/camps/${camp.id}/messages`)
        .send()
        .expect(401);
    });
  });

  describe('GET /api/v1/camps/:campId/messages/:messageId/', () => {
    it('should respond with `200` status code', async () => {
      const { camp, user, accessToken } = await crateCampWithManager();
      const { message } = await createMessageForCamp(camp.id, user.id);

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/messages/${message.id}`)
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(200);

      assertMessageResource(body.data, message, user);
    });

    it('should respond with `404` status code when message does not exist', async () => {
      const { camp, accessToken } = await crateCampWithManager();
      const messageId = ulid();

      await request()
        .get(`/api/v1/camps/${camp.id}/messages/${messageId}`)
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(404);
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const { camp, accessToken } = await createCampWithDifferentManager();
      const { message } = await createMessageForCamp(camp.id);

      await request()
        .get(`/api/v1/camps/${camp.id}/messages/${message.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const { message } = await createMessageForCamp(camp.id);

      await request()
        .get(`/api/v1/camps/${camp.id}/messages/${message.id}`)
        .send()
        .expect(401);
    });
  });

  describe('DELETE /api/v1/camps/:campId/messages/:messageId/', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 204 },
      { role: 'COORDINATOR', expectedStatus: 204 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await crateCampWithManager(
          undefined,
          role,
        );
        const { message } = await createSentMessageForCamp(camp.id);

        await request()
          .delete(`/api/v1/camps/${camp.id}/messages/${message.id}`)
          .auth(accessToken, { type: 'bearer' })
          .send()
          .expect(expectedStatus);
      },
    );

    it('should delete the sent message', async () => {
      const { camp, accessToken } = await crateCampWithManager();
      const { message } = await createSentMessageForCamp(camp.id);

      await request()
        .delete(`/api/v1/camps/${camp.id}/messages/${message.id}`)
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(204);

      const deleted = await prisma.message.findUnique({
        where: { id: message.id },
      });
      expect(deleted).toBeNull();
    });

    it('should respond with `404` status code when message does not exist', async () => {
      const { camp, accessToken } = await crateCampWithManager();
      const messageId = ulid();

      await request()
        .delete(`/api/v1/camps/${camp.id}/messages/${messageId}`)
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(404);
    });

    it('should respond with `404` status code for an automated event template', async () => {
      const { camp, accessToken } = await crateCampWithManager();
      const eventTemplate = await MessageTemplateFactory.create({
        camp: { connect: { id: camp.id } },
        event: 'registration_confirmed',
      });

      await request()
        .delete(`/api/v1/camps/${camp.id}/messages/${eventTemplate.id}`)
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(404);

      // The event template must remain untouched.
      const stillThere = await prisma.messageTemplate.findUnique({
        where: { id: eventTemplate.id },
      });
      expect(stillThere).not.toBeNull();
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const { camp, accessToken } = await createCampWithDifferentManager();
      const { message } = await createSentMessageForCamp(camp.id);

      await request()
        .delete(`/api/v1/camps/${camp.id}/messages/${message.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const { message } = await createSentMessageForCamp(camp.id);

      await request()
        .delete(`/api/v1/camps/${camp.id}/messages/${message.id}`)
        .send()
        .expect(401);
    });
  });

  describe('POST /api/v1/camps/:campId/messages/:messageId/attachments/', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 201 },
      { role: 'COORDINATOR', expectedStatus: 201 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await crateCampWithManager(
          undefined,
          role,
        );
        const { message } = await createSentMessageForCamp(camp.id);

        await request()
          .post(`/api/v1/camps/${camp.id}/messages/${message.id}/attachments`)
          .auth(accessToken, { type: 'bearer' })
          .send()
          .expect(expectedStatus);
      },
    );

    it('should duplicate the sent message attachments into session files', async () => {
      const { camp, accessToken } = await crateCampWithManager();
      const { message } = await createSentMessageForCamp(camp.id);
      await FileFactory.create({
        message: { connect: { id: message.id } },
        name: crypto.randomUUID() + '.pdf',
      });

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/messages/${message.id}/attachments`)
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(201);

      expect(body.data).toHaveLength(1);
    });

    it('should respond with `404` status code for an automated event template', async () => {
      const { camp, accessToken } = await crateCampWithManager();
      const eventTemplate = await MessageTemplateFactory.create({
        camp: { connect: { id: camp.id } },
        event: 'registration_confirmed',
      });

      await request()
        .post(
          `/api/v1/camps/${camp.id}/messages/${eventTemplate.id}/attachments`,
        )
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(404);
    });

    it('should respond with `404` status code when message does not exist', async () => {
      const { camp, accessToken } = await crateCampWithManager();

      await request()
        .post(`/api/v1/camps/${camp.id}/messages/${ulid()}/attachments`)
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(404);
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const { camp, accessToken } = await createCampWithDifferentManager();
      const { message } = await createSentMessageForCamp(camp.id);

      await request()
        .post(`/api/v1/camps/${camp.id}/messages/${message.id}/attachments`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const { message } = await createSentMessageForCamp(camp.id);

      await request()
        .post(`/api/v1/camps/${camp.id}/messages/${message.id}/attachments`)
        .send()
        .expect(401);
    });
  });
});

describe('/api/v1/files/', () => {
  const createMessageWithFile = async () => {
    const { user, accessToken, camp } = await crateCampWithManager();
    const { message } = await createMessageForCamp(camp.id);

    const fileName = crypto.randomUUID() + '.pdf';
    await uploadFile('blank.pdf', fileName);

    const file = await FileFactory.create({
      message: { connect: { id: message.id } },
      name: fileName,
    });

    return { file, user, accessToken, camp };
  };

  describe('GET /api/v1/files/:fileId', () => {
    it('should respond with `200` status code when user is camp manager', async () => {
      const { file, accessToken } = await createMessageWithFile();

      await request()
        .get(`/api/v1/files/${file.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const { file } = await createMessageWithFile();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/files/${file.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const { file } = await createMessageWithFile();

      await request().get(`/api/v1/files/${file.id}`).send().expect(401);
    });

    it('should respond with `404` status code when file id does not exists', async () => {
      const fileId = ulid();

      await request().get(`/api/v1/files/${fileId}`).send().expect(404);
    });
  });
});
