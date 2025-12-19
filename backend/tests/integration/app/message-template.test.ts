import { describe, it, expect } from 'vitest';
import {
  CampFactory,
  UserFactory,
  CampManagerFactory,
  MessageTemplateFactory,
  FileFactory,
} from '../../../prisma/factories';
import { generateAccessToken } from './utils/token';
import { request } from '../../utils/request';
import prisma from '../../utils/prisma';
import { ulid } from 'ulidx';
import crypto from 'crypto';
import { uploadFile } from './utils/file';

const createCampWithManagerAndToken = async (
  campData?: Parameters<(typeof CampFactory)['create']>[0],
  role = 'DIRECTOR',
) => {
  const camp = await CampFactory.create(campData);
  const user = await UserFactory.create();
  await CampManagerFactory.create({
    camp: { connect: { id: camp.id } },
    user: { connect: { id: user.id } },
    role,
  });
  const accessToken = generateAccessToken(user);

  return { camp, user, accessToken };
};

describe('/api/v1/camps/:campId/message-templates', () => {
  describe('GET /api/v1/camps/:campId/message-templates/', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with $expectedStatus status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(
          { messageTemplates: {} },
          role,
        );

        if (expectedStatus === 200) {
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
            .expect(expectedStatus);

          expect(body).toHaveProperty('data');
          expect(Array.isArray(body.data)).toBe(true);
          expect(body.data.length).toBe(numTemplates);
        } else {
          await request()
            .get(`/api/v1/camps/${camp.id}/message-templates/`)
            .send()
            .auth(accessToken, { type: 'bearer' })
            .expect(expectedStatus);
        }
      },
    );

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
      const { camp, accessToken } = await createCampWithManagerAndToken({
        messageTemplates: {},
      });

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
    it.each([
      { role: 'DIRECTOR', expectedStatus: 201 },
      { role: 'COORDINATOR', expectedStatus: 201 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with $expectedStatus status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(
          undefined,
          role,
        );
        const data = {
          event: 'some-event',
          subject: { en: 'Test Subject' },
          body: { en: 'Test body content' },
          priority: 'high',
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/message-templates/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);
      },
    );

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
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with $expectedStatus status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(
          undefined,
          role,
        );
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

        if (expectedStatus === 200) {
          const { body } = await request()
            .patch(
              `/api/v1/camps/${camp.id}/message-templates/${messageTemplate.id}`,
            )
            .send(updateData)
            .auth(accessToken, { type: 'bearer' })
            .expect(expectedStatus);

          expect(body).toHaveProperty('data');
          expect(body.data.subject).toEqual(updateData.subject);
          expect(body.data.body).toEqual(updateData.body);
          expect(body.data.priority).toEqual(updateData.priority);
        } else {
          await request()
            .patch(
              `/api/v1/camps/${camp.id}/message-templates/${messageTemplate.id}`,
            )
            .send(updateData)
            .auth(accessToken, { type: 'bearer' })
            .expect(expectedStatus);
        }
      },
    );

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
    it.each([
      { role: 'DIRECTOR', expectedStatus: 204 },
      { role: 'COORDINATOR', expectedStatus: 204 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with $expectedStatus status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(
          undefined,
          role,
        );
        const messageTemplate = await MessageTemplateFactory.create({
          camp: { connect: { id: camp.id } },
        });

        await request()
          .delete(
            `/api/v1/camps/${camp.id}/message-templates/${messageTemplate.id}`,
          )
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        // Verify that the message template is removed from the database if the request was successful
        if (expectedStatus === 204) {
          const found = await prisma.messageTemplate.findUnique({
            where: { id: messageTemplate.id },
          });
          expect(found).toBeNull();
        }
      },
    );

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

describe('/api/v1/files/', () => {
  const createMessageTemplateWithFile = async () => {
    const { user, accessToken, camp } = await createCampWithManagerAndToken();
    const messageTemplate = await MessageTemplateFactory.create({
      camp: { connect: { id: camp.id } },
    });

    const fileName = crypto.randomUUID() + '.pdf';
    await uploadFile('blank.pdf', fileName);

    const file = await FileFactory.create({
      messageTemplate: { connect: { id: messageTemplate.id } },
      name: fileName,
    });

    return { file, user, accessToken, camp, messageTemplate };
  };

  describe('GET /api/v1/files/:fileId', () => {
    it('should respond with `200` status code when user is camp manager', async () => {
      const { file, accessToken } = await createMessageTemplateWithFile();

      await request()
        .get(`/api/v1/files/${file.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const { file } = await createMessageTemplateWithFile();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/files/${file.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const { file } = await createMessageTemplateWithFile();

      await request().get(`/api/v1/files/${file.id}`).send().expect(401);
    });

    it('should respond with `404` status code when file id does not exists', async () => {
      const fileId = ulid();

      await request().get(`/api/v1/files/${fileId}`).send().expect(404);
    });
  });
});
