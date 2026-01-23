import { describe, it, expect } from 'vitest';
import {
  CampFactory,
  UserFactory,
  CampManagerFactory,
  MessageTemplateFactory,
  FileFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { ulid } from 'ulidx';
import crypto from 'crypto';
import { uploadFile } from './utils/file.js';

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
          country: 'gb',
          subject: 'Test Subject',
          body: 'Test body content',
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
          country: 'gb',
          subject: 'Test Subject',
          body: 'Test body content',
          priority: 'high',
        },
        expected: 201,
      },
      // Subject
      {
        name: 'subject is missing',
        data: {
          event: 'some-event',
          country: 'gb',
          body: 'Test body content',
        },
        expected: 400,
      },
      {
        name: 'subject is number',
        data: {
          event: 'some-event',
          country: 'gb',
          subject: 2,
          body: 'Test body content',
        },
        expected: 400,
      },
      // Body
      {
        name: 'body is missing',
        data: {
          event: 'some-event',
          country: 'gb',
          subject: 'Test Subject',
        },
        expected: 400,
      },
      {
        name: 'body is number',
        data: {
          event: 'some-event',
          country: 'gb',
          subject: 'Test Subject',
          body: 1,
        },
        expected: 400,
      },
      // Event
      {
        name: 'event is missing',
        data: {
          country: 'gb',
          subject: 'Test Subject',
          body: 'Test body content',
        },
        expected: 400,
      },
      {
        name: 'event is null',
        data: {
          event: null,
          country: 'gb',
          subject: 'Test Subject',
          body: 'Test body content',
        },
        expected: 400,
      },
      {
        name: 'event is number',
        data: {
          event: 1,
          country: 'gb',
          subject: 'Test Subject',
          body: 'Test body content',
        },
        expected: 400,
      },
      // Country
      {
        name: 'country is missing',
        data: {
          event: 'some-event',
          subject: 'Test Subject',
          body: 'Test body content',
        },
        expected: 400,
      },
      {
        name: 'country is null',
        data: {
          event: 'some-event',
          country: null,
          subject: 'Test Subject',
          body: 'Test body content',
        },
        expected: 400,
      },
      {
        name: 'country is invalid',
        data: {
          event: 'usa',
          country: 'gb',
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
          country: 'gb',
          subject: 'Test Subject',
          body: 'Test body content',
        },
        expected: 201,
      },
      {
        name: 'priority is invalid',
        data: {
          event: 'some-event',
          country: 'gb',
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
          country: 'gb',
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
        event: 'some-event',
        country: 'gb',
        subject: 'Test Subject',
        body: 'Test body content',
      };
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .post(`/api/v1/camps/${camp.id}/message-templates/`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with 409 status code when event for country already exists', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      await MessageTemplateFactory.create({
        camp: { connect: { id: camp.id } },
        event: 'some-event',
        country: 'gb',
      });

      const data = {
        event: 'some-event',
        country: 'gb',
        subject: 'Test Subject',
        body: 'Test body content',
      };

      await request()
        .post(`/api/v1/camps/${camp.id}/message-templates/`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(409);
    });

    it('should respond with 401 status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const data = {
        event: 'some-event',
        country: 'gb',
        subject: 'Test Subject',
        body: 'Test body content',
      };

      await request()
        .post(`/api/v1/camps/${camp.id}/message-templates/`)
        .send(data)
        .expect(401);
    });

    describe('files', () => {
      it('should respond with 201 status code when attachments are provided', async () => {
        const sessionId = crypto.randomUUID();
        const { camp, accessToken } = await createCampWithManagerAndToken();
        const file1 = await FileFactory.create({
          field: sessionId,
        });
        const file2 = await FileFactory.create({
          field: sessionId,
        });

        const data = {
          event: 'some-event',
          country: 'gb',
          subject: 'Test Subject',
          body: 'Test body content',
          priority: 'high',
          attachmentIds: [file1.id, file2.id],
        };

        const { body } = await request()
          .post(`/api/v1/camps/${camp.id}/message-templates/`)
          .send(data)
          .setSessionId(sessionId)
          .auth(accessToken, { type: 'bearer' })
          .expect(201);

        expect(body.data).toHaveProperty('attachments');
        expect(body.data.attachments).toHaveLength(2);

        const files = await prisma.file.findMany({
          where: { messageTemplateId: body.data.id },
        });

        expect(files.length).toBe(2);
      });

      it('should respond with 201 status code when attachments are empty', async () => {
        const { camp, accessToken } = await createCampWithManagerAndToken();
        const data = {
          event: 'some-event',
          country: 'gb',
          subject: 'Test Subject',
          body: 'Test body content',
          priority: 'high',
          attachmentIds: [],
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/message-templates/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(201);
      });

      it('should respond with 400 status code when attachments are invalid', async () => {
        const sessionId = crypto.randomUUID();
        const { camp, accessToken } = await createCampWithManagerAndToken();
        await FileFactory.create({
          field: sessionId,
        });

        const data = {
          event: 'some-event',
          country: 'gb',
          subject: 'Test Subject',
          body: 'Test body content',
          priority: 'high',
          attachmentIds: [crypto.randomUUID()],
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/message-templates/`)
          .send(data)
          .setSessionId(sessionId)
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });

      it('should respond with 400 status code when attachments session id mismatch', async () => {
        const sessionId = crypto.randomUUID();
        const { camp, accessToken } = await createCampWithManagerAndToken();
        const file1 = await FileFactory.create({
          field: crypto.randomUUID(),
        });
        const file2 = await FileFactory.create({
          field: sessionId,
        });

        const data = {
          event: 'some-event',
          country: 'gb',
          subject: 'Test Subject',
          body: 'Test body content',
          priority: 'high',
          attachmentIds: [file1.id, file2.id],
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/message-templates/`)
          .send(data)
          .setSessionId(sessionId)
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });

      it('should respond with 400 status code when attachments are already assigned', async () => {
        const sessionId = crypto.randomUUID();
        const { camp, accessToken } = await createCampWithManagerAndToken();
        const messageTemplate = await MessageTemplateFactory.create({
          camp: { connect: { id: camp.id } },
        });
        const file1 = await FileFactory.create({
          messageTemplate: { connect: { id: messageTemplate.id } },
          field: sessionId,
        });
        const file2 = await FileFactory.create({
          field: sessionId,
        });

        const data = {
          event: 'some-event',
          country: 'gb',
          subject: 'Test Subject',
          body: 'Test body content',
          priority: 'high',
          attachmentIds: [file1.id, file2.id],
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/message-templates/`)
          .send(data)
          .setSessionId(sessionId)
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });
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
          subject: 'Old subject',
          body: 'Old body',
          priority: 'normal',
        });

        const updateData = {
          subject: 'Updated Subject',
          body: 'Updated body',
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
        name: 'subject is string',
        data: {
          subject: 'Test subject',
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
        name: 'body is string',
        data: {
          body: 'Test body',
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
        subject: 'Updated Subject',
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
        subject: 'Updated Subject',
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
        subject: 'Updated Subject',
      };

      await request()
        .patch(
          `/api/v1/camps/${camp.id}/message-templates/${messageTemplate.id}`,
        )
        .send(updateData)
        .expect(401);
    });

    describe('files', () => {
      it('should respond with 200 status code when attachments are added', async () => {
        const sessionId = crypto.randomUUID();
        const { camp, accessToken } = await createCampWithManagerAndToken();
        const messageTemplate = await MessageTemplateFactory.create({
          camp: { connect: { id: camp.id } },
        });

        const file1 = await FileFactory.create({
          field: sessionId,
        });
        const file2 = await FileFactory.create({
          field: sessionId,
        });

        const data = {
          priority: 'low',
          attachmentIds: [file1.id, file2.id],
        };

        const { body } = await request()
          .patch(
            `/api/v1/camps/${camp.id}/message-templates/${messageTemplate.id}`,
          )
          .send(data)
          .setSessionId(sessionId)
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body.data).toHaveProperty('attachments');
        expect(body.data.attachments).toHaveLength(2);

        const files = await prisma.file.findMany({
          where: { messageTemplateId: body.data.id },
        });

        expect(files.length).toBe(2);
      });

      it('should respond with 200 status code when attachments are removed', async () => {
        const sessionId = crypto.randomUUID();
        const { camp, accessToken } = await createCampWithManagerAndToken();
        const messageTemplate = await MessageTemplateFactory.create({
          camp: { connect: { id: camp.id } },
        });
        await FileFactory.create({
          field: sessionId,
          messageTemplate: { connect: { id: messageTemplate.id } },
        });
        await FileFactory.create({
          messageTemplate: { connect: { id: messageTemplate.id } },
        });
        const file = await FileFactory.create({
          field: sessionId,
        });

        const data = {
          attachmentIds: [file.id],
        };

        const { body } = await request()
          .patch(
            `/api/v1/camps/${camp.id}/message-templates/${messageTemplate.id}`,
          )
          .send(data)
          .setSessionId(sessionId)
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body.data).toHaveProperty('attachments');
        expect(body.data.attachments).toHaveLength(1);
        expect(body.data.attachments[0]).toHaveProperty('id', file.id);

        const files = await prisma.file.findMany({
          where: { messageTemplateId: body.data.id },
        });

        expect(files.length).toBe(1);
        expect(files[0].id).toBe(file.id);
      });

      it('should respond with 200 status code when attachments are replaced', async () => {
        const sessionId = crypto.randomUUID();
        const { camp, accessToken } = await createCampWithManagerAndToken();
        const messageTemplate = await MessageTemplateFactory.create({
          camp: { connect: { id: camp.id } },
        });

        const data = {
          attachmentIds: [],
        };

        const { body } = await request()
          .patch(
            `/api/v1/camps/${camp.id}/message-templates/${messageTemplate.id}`,
          )
          .send(data)
          .setSessionId(sessionId)
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body.data).toHaveProperty('attachments');
        expect(body.data.attachments).toHaveLength(0);

        const files = await prisma.file.findMany({
          where: { messageTemplateId: body.data.id },
        });

        expect(files.length).toBe(0);
      });

      it('should respond with 400 status code when attachments are invalid', async () => {
        const sessionId = crypto.randomUUID();
        const { camp, accessToken } = await createCampWithManagerAndToken();
        const messageTemplate = await MessageTemplateFactory.create({
          camp: { connect: { id: camp.id } },
        });
        await FileFactory.create({
          field: sessionId,
        });

        const data = {
          attachmentIds: [crypto.randomUUID()],
        };

        await request()
          .patch(
            `/api/v1/camps/${camp.id}/message-templates/${messageTemplate.id}`,
          )
          .send(data)
          .setSessionId(sessionId)
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });

      it('should respond with 400 status code when attachments session id mismatch', async () => {
        const sessionId = crypto.randomUUID();
        const { camp, accessToken } = await createCampWithManagerAndToken();
        const messageTemplate = await MessageTemplateFactory.create({
          camp: { connect: { id: camp.id } },
        });
        const file1 = await FileFactory.create({
          field: crypto.randomUUID(),
        });
        const file2 = await FileFactory.create({
          field: sessionId,
        });

        const data = {
          attachmentIds: [file1.id, file2.id],
        };

        await request()
          .patch(
            `/api/v1/camps/${camp.id}/message-templates/${messageTemplate.id}`,
          )
          .send(data)
          .setSessionId(sessionId)
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });

      it('should respond with 400 status code when attachments are already assigned', async () => {
        const sessionId = crypto.randomUUID();
        const { camp, accessToken } = await createCampWithManagerAndToken();
        const messageTemplate = await MessageTemplateFactory.create({
          camp: { connect: { id: camp.id } },
        });
        const file1 = await FileFactory.create({
          messageTemplate: { connect: { id: messageTemplate.id } },
          field: sessionId,
        });
        await MessageTemplateFactory.create({
          attachments: { connect: { id: file1.id } },
          camp: { connect: { id: camp.id } },
        });
        const file2 = await FileFactory.create({
          field: sessionId,
        });

        const data = {
          attachmentIds: [file1.id, file2.id],
        };

        await request()
          .patch(
            `/api/v1/camps/${camp.id}/message-templates/${messageTemplate.id}`,
          )
          .send(data)
          .setSessionId(sessionId)
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });
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
