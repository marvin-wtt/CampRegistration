import { describe, it, expect } from 'vitest';
import {
  CampFactory,
  UserFactory,
  CampManagerFactory,
  MessageTemplateFactory,
} from '../../prisma/factories';
import { generateAccessToken } from '../utils/token';
import { request } from '../utils/request';
import prisma from '../utils/prisma';
import { ulid } from 'ulidx';

describe('/api/v1/camps/:campId/message-templates', () => {
  // Helper to create a camp with a manager and generate an access token.
  const createCampWithManagerAndToken = async () => {
    const camp = await CampFactory.create();
    const user = await UserFactory.create();
    await CampManagerFactory.create({
      camp: { connect: { id: camp.id } },
      user: { connect: { id: user.id } },
    });
    const accessToken = generateAccessToken(user);
    return { camp, user, accessToken };
  };

  describe('GET /api/v1/camps/:campId/message-templates/', () => {
    it('should respond with 200 status code when user is camp manager', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const numTemplates = 3;
      for (let i = 0; i < numTemplates; i++) {
        await MessageTemplateFactory.create({
          camp: { connect: { id: camp.id } },
        });
      }

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/message-templates/`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBe(numTemplates);
    });

    it('should respond with 200 status code with defaults', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      await MessageTemplateFactory.create({
        camp: { connect: { id: camp.id } },
      });

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/message-templates/?includeDefaults=true`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(1);
    });

    it('should respond with 200 status code with hasEvent', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      await MessageTemplateFactory.create({
        camp: { connect: { id: camp.id } },
        event: 'test-event',
      });

      await MessageTemplateFactory.create({
        camp: { connect: { id: camp.id } },
        event: 'test-event',
      });

      await MessageTemplateFactory.create({
        camp: { connect: { id: camp.id } },
        event: null,
      });

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/message-templates/?hasEvent=true`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBe(2);
    });

    it('should respond with 403 status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/camps/${camp.id}/message-templates/`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with 401 status code when unauthenticated', async () => {
      const camp = await CampFactory.create();

      await request()
        .get(`/api/v1/camps/${camp.id}/message-templates/`)
        .send()
        .expect(401);
    });
  });

  describe('GET /api/v1/camps/:campId/message-templates/:messageTemplateId', () => {
    it('should respond with 200 status code when user is camp manager', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const messageTemplate = await MessageTemplateFactory.create({
        camp: { connect: { id: camp.id } },
      });

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/message-templates/${messageTemplate.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data');
      expect(body.data.id).toBe(messageTemplate.id);
      expect(body.data).toHaveProperty('event', messageTemplate.event);
      expect(body.data).toHaveProperty('subject', messageTemplate.subject);
      expect(body.data).toHaveProperty('body', messageTemplate.body);
    });

    it('should respond with 404 status code when message template does not exist', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const nonExistingId = ulid();

      await request()
        .get(`/api/v1/camps/${camp.id}/message-templates/${nonExistingId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with 403 status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const messageTemplate = await MessageTemplateFactory.create({
        camp: { connect: { id: camp.id } },
      });
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/camps/${camp.id}/message-templates/${messageTemplate.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with 401 status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const messageTemplate = await MessageTemplateFactory.create({
        camp: { connect: { id: camp.id } },
      });

      await request()
        .get(`/api/v1/camps/${camp.id}/message-templates/${messageTemplate.id}`)
        .send()
        .expect(401);
    });
  });

  describe('POST /api/v1/camps/:campId/message-templates/', () => {
    const messageCreateBody = [
      {
        name: 'input is valid',
        data: {
          event: 'some-event',
          subject: { en: 'Test Subject' },
          body: { en: 'Test body content' },
          priority: 'high',
        },
        expected: 201,
      },
      // Subject
      {
        name: 'subject is translated',
        data: {
          event: 'some-event',
          subject: { de: 'Test subject de', en: 'Test subject en' },
          body: 'Test body content',
        },
        expected: 201,
      },
      {
        name: 'subject is missing',
        data: {
          event: 'some-event',
          body: 'Test body content',
        },
        expected: 400,
      },
      {
        name: 'subject is number',
        data: {
          event: 'some-event',
          subject: 2,
          body: 'Test body content',
        },
        expected: 400,
      },
      // Body
      {
        name: 'body is translated',
        data: {
          event: 'some-event',
          subject: 'Test Subject',
          body: { en: 'Test body en', de: 'Test body de' },
        },
        expected: 201,
      },
      {
        name: 'body is missing',
        data: {
          event: 'some-event',
          subject: 'Test Subject',
        },
        expected: 400,
      },
      {
        name: 'body is number',
        data: {
          event: 'some-event',
          subject: 'Test Subject',
          body: 1,
        },
        expected: 400,
      },
      // Event
      {
        name: 'event is missing',
        data: {
          subject: 'Test Subject',
          body: 'Test body content',
        },
        expected: 400,
      },
      {
        name: 'event is null',
        data: {
          event: null,
          subject: 'Test Subject',
          body: 'Test body content',
        },
        expected: 400,
      },
      {
        name: 'event is number',
        data: {
          event: 1,
          subject: 'Test Subject',
          body: 'Test body content',
        },
        expected: 400,
      },
      // Priority
      {
        name: 'priority is missing',
        data: {
          event: 'some-event',
          subject: 'Test Subject',
          body: 'Test body content',
        },
        expected: 201,
      },
      {
        name: 'priority is invalid',
        data: {
          event: 'some-event',
          subject: 'Test Subject',
          body: 'Test body content',
          priority: 'urgent',
        },
        expected: 400,
      },
      {
        name: 'priority is null',
        data: {
          event: 'some-event',
          subject: 'Test Subject',
          body: 'Test body content',
          priority: null,
        },
        expected: 400,
      },
    ];

    it.each(messageCreateBody)(
      'should respond with `$expected` status code when $name',
      async ({ data, expected }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken();

        await request()
          .post(`/api/v1/camps/${camp.id}/message-templates/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(expected);
      },
    );

    it('should respond with 403 status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const data = {
        subject: { en: 'Test Subject' },
        body: { en: 'Test body content' },
      };
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .post(`/api/v1/camps/${camp.id}/message-templates/`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with 401 status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const data = {
        subject: { en: 'Test Subject' },
        body: { en: 'Test body content' },
      };

      await request()
        .post(`/api/v1/camps/${camp.id}/message-templates/`)
        .send(data)
        .expect(401);
    });
  });

  describe('PATCH /api/v1/camps/:campId/message-templates/:messageTemplateId', () => {
    it('should respond with 200 status code', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const messageTemplate = await MessageTemplateFactory.create({
        camp: { connect: { id: camp.id } },
        subject: { en: 'Old Subject' },
        body: { en: 'Old body' },
        priority: 'normal',
      });

      const updateData = {
        subject: { en: 'Updated Subject' },
        body: { en: 'Updated body' },
        priority: 'low',
      };

      const { body } = await request()
        .patch(
          `/api/v1/camps/${camp.id}/message-templates/${messageTemplate.id}`,
        )
        .send(updateData)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data');
      expect(body.data.subject).toEqual(updateData.subject);
      expect(body.data.body).toEqual(updateData.body);
      expect(body.data.priority).toEqual(updateData.priority);
    });

    const messageCreateBody = [
      // Subject
      {
        name: 'subject is translated',
        data: {
          subject: { de: 'Test subject de', en: 'Test subject en' },
        },
        expected: 200,
      },
      {
        name: 'subject is number',
        data: {
          subject: 2,
        },
        expected: 400,
      },
      {
        name: 'subject is null',
        data: {
          subject: null,
        },
        expected: 400,
      },
      // Body
      {
        name: 'body is translated',
        data: {
          body: { en: 'Test body en', de: 'Test body de' },
        },
        expected: 200,
      },
      {
        name: 'body is number',
        data: {
          body: 1,
        },
        expected: 400,
      },
      {
        name: 'body is null',
        data: {
          body: null,
        },
        expected: 400,
      },
      // Priority
      {
        name: 'priority is invalid',
        data: {
          priority: 'urgent',
        },
        expected: 400,
      },
      {
        name: 'priority is null',
        data: {
          priority: null,
        },
        expected: 400,
      },
    ];

    it.each(messageCreateBody)(
      'should respond with `$expected` status code when $name',
      async ({ data, expected }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken();

        const messageTemplate = await MessageTemplateFactory.create({
          camp: { connect: { id: camp.id } },
        });

        await request()
          .patch(
            `/api/v1/camps/${camp.id}/message-templates/${messageTemplate.id}`,
          )
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(expected);
      },
    );

    it('should respond with 404 status code when message template does not exist', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const nonExistingId = ulid();
      const updateData = {
        subject: { en: 'Updated Subject' },
      };

      await request()
        .patch(`/api/v1/camps/${camp.id}/message-templates/${nonExistingId}`)
        .send(updateData)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with 403 status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const messageTemplate = await MessageTemplateFactory.create({
        camp: { connect: { id: camp.id } },
      });
      const updateData = {
        subject: { en: 'Updated Subject' },
      };
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .patch(
          `/api/v1/camps/${camp.id}/message-templates/${messageTemplate.id}`,
        )
        .send(updateData)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with 401 status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const messageTemplate = await MessageTemplateFactory.create({
        camp: { connect: { id: camp.id } },
      });
      const updateData = {
        subject: { en: 'Updated Subject' },
      };

      await request()
        .patch(
          `/api/v1/camps/${camp.id}/message-templates/${messageTemplate.id}`,
        )
        .send(updateData)
        .expect(401);
    });
  });

  describe('DELETE /api/v1/camps/:campId/message-templates/:messageTemplateId', () => {
    it('should respond with 204 status code when deletion is successful', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const messageTemplate = await MessageTemplateFactory.create({
        camp: { connect: { id: camp.id } },
      });

      await request()
        .delete(
          `/api/v1/camps/${camp.id}/message-templates/${messageTemplate.id}`,
        )
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      // Verify that the message template is removed from the database.
      const found = await prisma.messageTemplate.findUnique({
        where: { id: messageTemplate.id },
      });
      expect(found).toBeNull();
    });

    it('should respond with 404 status code when message template does not exist', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const nonExistingId = ulid();

      await request()
        .delete(`/api/v1/camps/${camp.id}/message-templates/${nonExistingId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with 403 status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const messageTemplate = await MessageTemplateFactory.create({
        camp: { connect: { id: camp.id } },
      });
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .delete(
          `/api/v1/camps/${camp.id}/message-templates/${messageTemplate.id}`,
        )
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with 401 status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const messageTemplate = await MessageTemplateFactory.create({
        camp: { connect: { id: camp.id } },
      });

      await request()
        .delete(
          `/api/v1/camps/${camp.id}/message-templates/${messageTemplate.id}`,
        )
        .send()
        .expect(401);
    });
  });
});
