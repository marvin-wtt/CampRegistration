import { describe, expect, it } from 'vitest';
import {
  CampFactory,
  CampManagerFactory,
  RegistrationFactory,
  UserFactory,
  MessageFactory,
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

const createMessageForCamp = async (campId: string) => {
  const registration = await RegistrationFactory.create({
    camp: { connect: { id: campId } },
  });
  const message = await MessageFactory.create({
    registration: { connect: { id: registration.id } },
  });

  return { message, registration };
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
      templateId: string,
      expected: {
        body: string;
        subject: string;
        priority: 'high' | 'normal' | 'low';
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
          const models = await prisma.message.findMany({
            where: {
              templateId,
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
            priority: entry.priority,
          });
        }
      }
    };

    it('should respond with `201` status code', async () => {
      const { camp, accessToken } = await crateCampWithManager();

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

      await assertMessages(body.data.id, [
        {
          subject: `Hi, ${registrationA.data.first_name}, welcome to ${camp.name}`,
          body:
            `Hello ${registrationA.data.first_name}, the min age is ${camp.minAge}. ` +
            `${camp.maxAge} ${camp.maxParticipants} ${camp.location} ${camp.organizer} ${camp.price}`,
          priority: 'high',
          replyTo: camp.contactEmail,
          emails: registrationA.emails,
        },
        {
          subject: `Hi, ${registrationB.data.first_name}, welcome to ${camp.name}`,
          body:
            `Hello ${registrationB.data.first_name}, the min age is ${camp.minAge}. ` +
            `${camp.maxAge} ${camp.maxParticipants} ${camp.location} ${camp.organizer} ${camp.price}`,
          priority: 'high',
          replyTo: camp.contactEmail,
          emails: registrationB.emails,
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

      await assertMessages(body.data.id, [
        {
          subject: `Hi, ${registrationA.data.first_name}, welcome to ${camp.name['de']}`,
          body: `Hello ${registrationA.data.first_name}, ${camp.organizer['de']} ${camp.location['de']} ${camp.maxParticipants['de']}`,
          priority: 'normal',
          replyTo: camp.contactEmail['de'],
          emails: registrationA.emails,
        },
        {
          subject: `Hi, ${registrationB.data.first_name}, welcome to ${camp.name['fr']}`,
          body: `Hello ${registrationB.data.first_name}, ${camp.organizer['fr']} ${camp.location['fr']} ${camp.maxParticipants['fr']}`,
          priority: 'normal',
          replyTo: camp.contactEmail['fr'],
          emails: registrationB.emails,
        },
        {
          subject: `Hi, ${registrationC.data.first_name}, welcome to ${camp.name['de']}`,
          body: `Hello ${registrationC.data.first_name}, ${camp.organizer['de']} ${camp.location['de']} ${camp.maxParticipants['de']}`,
          priority: 'normal',
          replyTo: camp.contactEmail['de'],
          emails: registrationC.emails,
        },
      ]);
    });

    it.todo('should respond with `201` status code with attachments');

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
      { role: 'DIRECTOR', expectedStatus: 501 },
      { role: 'COORDINATOR', expectedStatus: 501 },
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
    it('should respond with `501` status code', async () => {
      const { camp, accessToken } = await crateCampWithManager();
      const { message } = await createMessageForCamp(camp.id);

      await request()
        .get(`/api/v1/camps/${camp.id}/messages/${message.id}`)
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(501);
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
      { role: 'DIRECTOR', expectedStatus: 501 },
      { role: 'COORDINATOR', expectedStatus: 501 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await crateCampWithManager(
          undefined,
          role,
        );
        const { message } = await createMessageForCamp(camp.id);

        await request()
          .delete(`/api/v1/camps/${camp.id}/messages/${message.id}`)
          .auth(accessToken, { type: 'bearer' })
          .send()
          .expect(expectedStatus);
      },
    );

    it('should respond with `404` status code when message does not exist', async () => {
      const { camp, accessToken } = await crateCampWithManager();
      const messageId = ulid();

      await request()
        .delete(`/api/v1/camps/${camp.id}/messages/${messageId}`)
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(404);
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const { camp, accessToken } = await createCampWithDifferentManager();
      const { message } = await createMessageForCamp(camp.id);

      await request()
        .delete(`/api/v1/camps/${camp.id}/messages/${message.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const { message } = await createMessageForCamp(camp.id);

      await request()
        .delete(`/api/v1/camps/${camp.id}/messages/${message.id}`)
        .send()
        .expect(401);
    });
  });
});

describe('/api/v1/files/', () => {
  const createMessageWithFile = async () => {
    const { user, accessToken, camp } = await crateCampWithManager();
    const { message, registration } = await createMessageForCamp(camp.id);

    const fileName = crypto.randomUUID() + '.pdf';
    await uploadFile('blank.pdf', fileName);

    const file = await FileFactory.create({
      message: { connect: { id: message.id } },
      name: fileName,
    });

    return { file, user, accessToken, camp, registration };
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
