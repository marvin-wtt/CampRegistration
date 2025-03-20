import { describe, expect, it } from 'vitest';
import {
  CampFactory,
  CampManagerFactory,
  RegistrationFactory,
  UserFactory,
} from '../../prisma/factories';
import { generateAccessToken } from '../utils/token';
import { request } from '../utils/request';
import { MessageFactory } from '../../prisma/factories/message';
import { ulid } from 'ulidx';
import prisma from '../utils/prisma';
import { mailer } from '../utils/mailer';
import { messageCreateBody } from '../fixtures/message/message.fixture';

describe('/api/v1/camps/:campId/messages', () => {
  const crateCampWithManager = async (
    campCreateData?: Parameters<(typeof CampFactory)['create']>[0],
  ) => {
    const user = await UserFactory.create();
    const accessToken = generateAccessToken(user);

    const camp = await CampFactory.create(campCreateData);
    await CampManagerFactory.create({
      user: { connect: { id: user.id } },
      camp: { connect: { id: camp.id } },
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

  describe('POST /api/v1/camps/:campId/messages/', () => {
    it('should respond with `201` status code', async () => {
      const { camp, accessToken } = await crateCampWithManager();

      const registration = await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        data: {
          first_name: 'Max',
        },
        campData: {
          email: ['test@example.com'],
        },
      });

      const data = {
        registrationIds: [registration.id],
        subject:
          'Hi, {{ registration.data.first_name  }}, welcome to {{ camp.name }}',
        body: 'Hello {{ registration.data.first_name  }}, the min age is {{ camp.minAge }}.',
        priority: 'high',
      };

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/messages`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      const renderedSubject = `Hi, ${registration.data.first_name}, welcome to ${camp.name}`;
      const renderedBody = `Hello ${registration.data.first_name}, the min age is ${camp.minAge}.`;

      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toHaveProperty('id');
      expect(body.data[0]).toHaveProperty('subject', renderedSubject);
      expect(body.data[0]).toHaveProperty('body', renderedBody);
      expect(body.data[0]).toHaveProperty('priority', 'high');

      const model = await prisma.message.findUnique({
        where: { id: body.data[0].id },
      });

      expect(model).toBeDefined();
      expect(model).toHaveProperty('subject', renderedSubject);
      expect(model).toHaveProperty('body', renderedBody);
      expect(model).toHaveProperty('priority', 'high');

      expect(mailer.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: registration.campData.email[0],
          subject: expect.stringContaining(renderedSubject),
          body: expect.stringContaining(renderedBody),
          replyTo: camp.contactEmail,
          priority: 'high',
        }),
      );
    });

    it.todo(
      'should respond with `201` status code with translated camp fields',
      async () => {
        // TODO Translated reply to
      },
    );

    it.todo('should respond with `201` status code with multiple emails');

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

    it.todo(
      'should respond with `201` status code with multiple registrations',
    );

    it('should respond with `400` status code when a registration does not exist', async () => {
      const { camp, accessToken } = await crateCampWithManager();

      const registration = await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        data: {
          first_name: 'Max',
        },
        campData: {
          email: ['test@example.com'],
        },
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
    it('should respond with `501` status code', async () => {
      const { camp, accessToken } = await crateCampWithManager();

      await request()
        .get(`/api/v1/camps/${camp.id}/messages`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(501);
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
    it('should respond with `501` status code', async () => {
      const { camp, accessToken } = await crateCampWithManager();
      const { message } = await createMessageForCamp(camp.id);

      await request()
        .delete(`/api/v1/camps/${camp.id}/messages/${message.id}`)
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(501);
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
