import { describe, expect, it } from 'vitest';
import {
  CampFactory,
  CampManagerFactory,
  RegistrationFactory,
  UserFactory,
  MessageFactory,
} from '../../prisma/factories';
import { generateAccessToken } from '../utils/token';
import { request } from '../utils/request';
import { ulid } from 'ulidx';
import { encode } from 'html-entities';
import prisma from '../utils/prisma';
import { mailer } from '../utils/mailer';
import { messageCreateBody } from '../fixtures/message/message.fixture';

describe('/api/v1/camps/:campId/messages', () => {
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
      actual: any,
      expected: {
        body: string;
        subject: string;
        priority: string;
        to: string[];
        replyTo: string | string[];
      }[],
    ) => {
      expect(actual.data).toHaveLength(expected.length);

      // Encode html characters
      expected = expected.map((value) => ({
        ...value,
        subject: encode(value.subject).replace(/&apos;|&#39;/g, '&#x27;'),
        body: encode(value.body).replace(/&apos;|&#39;/g, '&#x27;'),
      }));

      const emailCount = expected.reduce((acc, curr) => {
        return acc + curr.to.length;
      }, 0);

      expect(mailer.sendMail).toHaveBeenCalledTimes(emailCount);

      for (const [i, value] of expected.entries()) {
        expect(actual.data[i]).toHaveProperty('id');
        expect(actual.data[i]).toHaveProperty('subject', value.subject);
        expect(actual.data[i]).toHaveProperty('body', value.body);
        expect(actual.data[i]).toHaveProperty('priority', value.priority);

        const model = await prisma.message.findUnique({
          where: { id: actual.data[i].id },
        });

        expect(model).toBeDefined();
        expect(model).toHaveProperty('subject', value.subject);
        expect(model).toHaveProperty('body', value.body);
        expect(model).toHaveProperty('priority', value.priority);

        for (const email of value.to) {
          expect(mailer.sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
              to: email,
              subject: expect.stringContaining(value.subject),
              body: expect.stringContaining(value.body),
              replyTo: value.replyTo,
              priority: value.priority,
            }),
          );
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

      await assertMessages(body, [
        {
          subject: `Hi, ${registrationA.data.first_name}, welcome to ${camp.name}`,
          body:
            `Hello ${registrationA.data.first_name}, the min age is ${camp.minAge}. ` +
            `${camp.maxAge} ${camp.maxParticipants} ${camp.location} ${camp.organizer} ${camp.price}`,
          priority: 'high',
          replyTo: camp.contactEmail as string,
          to: registrationA.emails as string[],
        },
        {
          subject: `Hi, ${registrationB.data.first_name}, welcome to ${camp.name}`,
          body:
            `Hello ${registrationB.data.first_name}, the min age is ${camp.minAge}. ` +
            `${camp.maxAge} ${camp.maxParticipants} ${camp.location} ${camp.organizer} ${camp.price}`,
          priority: 'high',
          replyTo: camp.contactEmail as string,
          to: registrationB.emails as string[],
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

      await assertMessages(body, [
        {
          subject: `Hi, ${registrationA.data.first_name}, welcome to ${camp.name['de']}`,
          body: `Hello ${registrationA.data.first_name}, ${camp.organizer['de']} ${camp.location['de']} ${camp.maxParticipants['de']}`,
          priority: 'normal',
          replyTo: camp.contactEmail['de'] as string,
          to: registrationA.emails as string[],
        },
        {
          subject: `Hi, ${registrationB.data.first_name}, welcome to ${camp.name['fr']}`,
          body: `Hello ${registrationB.data.first_name}, ${camp.organizer['fr']} ${camp.location['fr']} ${camp.maxParticipants['fr']}`,
          priority: 'normal',
          replyTo: camp.contactEmail['fr'] as string,
          to: registrationB.emails as string[],
        },
        {
          subject: `Hi, ${registrationC.data.first_name}, welcome to ${camp.name['de']}`,
          body: `Hello ${registrationC.data.first_name}, ${camp.organizer['de']} ${camp.location['de']} ${camp.maxParticipants['de']}`,
          priority: 'normal',
          replyTo: camp.contactEmail['de'] as string,
          to: registrationC.emails as string[],
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
