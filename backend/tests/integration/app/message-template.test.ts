import { describe, it, expect } from 'vitest';
import {
  EventFactory,
  UserFactory,
  EventManagerFactory,
  MessageFactory,
  MessageTemplateFactory,
  FileFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { ulid } from 'ulidx';
import crypto from 'crypto';
import { uploadFile } from './utils/file.js';

const createEventWithManagerAndToken = async (
  eventData?: Parameters<(typeof EventFactory)['create']>[0],
  role = 'DIRECTOR',
) => {
  const event = await EventFactory.create(eventData);
  const user = await UserFactory.create();
  await EventManagerFactory.create({
    event: { connect: { id: event.id } },
    user: { connect: { id: user.id } },
    role,
  });
  const accessToken = generateAccessToken(user);

  return { event, user, accessToken };
};

describe('/api/v1/events/:eventId/message-templates', () => {
  describe('GET /api/v1/events/:eventId/message-templates/', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with $expectedStatus status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } = await createEventWithManagerAndToken(
          { messageTemplates: {} },
          role,
        );

        if (expectedStatus === 200) {
          const numTemplates = 3;
          for (let i = 0; i < numTemplates; i++) {
            await MessageTemplateFactory.create({
              event: { connect: { id: event.id } },
              trigger: `test-event-${i}`,
            });
          }

          const { body } = await request()
            .get(`/api/v1/events/${event.id}/message-templates/`)
            .send()
            .auth(accessToken, { type: 'bearer' })
            .expect(expectedStatus);

          expect(body).toHaveProperty('data');
          expect(Array.isArray(body.data)).toBe(true);
          expect(body.data.length).toBe(numTemplates);
        } else {
          await request()
            .get(`/api/v1/events/${event.id}/message-templates/`)
            .send()
            .auth(accessToken, { type: 'bearer' })
            .expect(expectedStatus);
        }
      },
    );

    it('should respond with 200 status code with defaults', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await MessageTemplateFactory.create({
        event: { connect: { id: event.id } },
      });

      const { body } = await request()
        .get(
          `/api/v1/events/${event.id}/message-templates/?includeDefaults=true`,
        )
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(1);
    });

    it('should only return event templates, not ad-hoc sent messages', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken({
        messageTemplates: {},
      });

      await MessageTemplateFactory.create({
        event: { connect: { id: event.id } },
        trigger: 'test-event-1',
      });

      await MessageTemplateFactory.create({
        event: { connect: { id: event.id } },
        trigger: 'test-event-2',
      });

      // Ad-hoc sent messages live in a different table and must not surface here.
      await MessageFactory.create({
        event: { connect: { id: event.id } },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/message-templates/`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBe(2);
      expect(
        body.data.every((template: { trigger: string | null }) => {
          return template.trigger !== null;
        }),
      ).toBe(true);
    });

    it('should not include recipients for event templates', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken({
        messageTemplates: {},
      });
      await MessageTemplateFactory.create({
        event: { connect: { id: event.id } },
        trigger: 'test-event',
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/message-templates/`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data[0]).not.toHaveProperty('recipients');
    });

    it('should respond with 403 status code when user is not event manager', async () => {
      const event = await EventFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/events/${event.id}/message-templates/`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with 401 status code when unauthenticated', async () => {
      const event = await EventFactory.create();

      await request()
        .get(`/api/v1/events/${event.id}/message-templates/`)
        .send()
        .expect(401);
    });
  });

  describe('GET /api/v1/events/:eventId/message-templates/:messageTemplateId', () => {
    it('should respond with 200 status code when user is event manager', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const messageTemplate = await MessageTemplateFactory.create({
        event: { connect: { id: event.id } },
        trigger: 'some-event',
      });

      const { body } = await request()
        .get(
          `/api/v1/events/${event.id}/message-templates/${messageTemplate.id}`,
        )
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data');
      expect(body.data.id).toBe(messageTemplate.id);
      expect(body.data).toHaveProperty('trigger', messageTemplate.trigger);
      expect(body.data).toHaveProperty('subject', messageTemplate.subject);
      expect(body.data).toHaveProperty('body', messageTemplate.body);
    });

    it('should respond with 404 status code when message template does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const nonExistingId = ulid();

      await request()
        .get(`/api/v1/events/${event.id}/message-templates/${nonExistingId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with 403 status code when user is not event manager', async () => {
      const event = await EventFactory.create();
      const messageTemplate = await MessageTemplateFactory.create({
        event: { connect: { id: event.id } },
        trigger: 'some-event',
      });
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(
          `/api/v1/events/${event.id}/message-templates/${messageTemplate.id}`,
        )
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with 401 status code when unauthenticated', async () => {
      const event = await EventFactory.create();
      const messageTemplate = await MessageTemplateFactory.create({
        event: { connect: { id: event.id } },
        trigger: 'some-event',
      });

      await request()
        .get(
          `/api/v1/events/${event.id}/message-templates/${messageTemplate.id}`,
        )
        .send()
        .expect(401);
    });
  });

  describe('POST /api/v1/events/:eventId/message-templates/', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 201 },
      { role: 'COORDINATOR', expectedStatus: 201 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with $expectedStatus status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } = await createEventWithManagerAndToken(
          undefined,
          role,
        );
        const data = {
          trigger: 'some-event',
          country: 'gb',
          subject: 'Test Subject',
          body: 'Test body content',
          priority: 'high',
        };

        await request()
          .post(`/api/v1/events/${event.id}/message-templates/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);
      },
    );

    const messageCreateBody = [
      {
        name: 'input is valid',
        data: {
          trigger: 'some-event',
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
          trigger: 'some-event',
          country: 'gb',
          body: 'Test body content',
        },
        expected: 400,
      },
      {
        name: 'subject is number',
        data: {
          trigger: 'some-event',
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
          trigger: 'some-event',
          country: 'gb',
          subject: 'Test Subject',
        },
        expected: 400,
      },
      {
        name: 'body is number',
        data: {
          trigger: 'some-event',
          country: 'gb',
          subject: 'Test Subject',
          body: 1,
        },
        expected: 400,
      },
      // Trigger
      {
        name: 'trigger is missing',
        data: {
          country: 'gb',
          subject: 'Test Subject',
          body: 'Test body content',
        },
        expected: 400,
      },
      {
        name: 'trigger is null',
        data: {
          trigger: null,
          country: 'gb',
          subject: 'Test Subject',
          body: 'Test body content',
        },
        expected: 400,
      },
      {
        name: 'trigger is number',
        data: {
          trigger: 1,
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
          trigger: 'some-event',
          subject: 'Test Subject',
          body: 'Test body content',
        },
        expected: 400,
      },
      {
        name: 'country is null',
        data: {
          trigger: 'some-event',
          country: null,
          subject: 'Test Subject',
          body: 'Test body content',
        },
        expected: 400,
      },
      {
        name: 'country is invalid',
        data: {
          trigger: 'some-event',
          country: 'usa',
          subject: 'Test Subject',
          body: 'Test body content',
        },
        expected: 400,
      },
      // Priority
      {
        name: 'priority is missing',
        data: {
          trigger: 'some-event',
          country: 'gb',
          subject: 'Test Subject',
          body: 'Test body content',
        },
        expected: 201,
      },
      {
        name: 'priority is invalid',
        data: {
          trigger: 'some-event',
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
          trigger: 'some-event',
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
        const { event, accessToken } = await createEventWithManagerAndToken();

        await request()
          .post(`/api/v1/events/${event.id}/message-templates/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(expected);
      },
    );

    it('should respond with 403 status code when user is not event manager', async () => {
      const event = await EventFactory.create();
      const data = {
        trigger: 'some-event',
        country: 'gb',
        subject: 'Test Subject',
        body: 'Test body content',
      };
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .post(`/api/v1/events/${event.id}/message-templates/`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with 409 status code when event for country already exists', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      await MessageTemplateFactory.create({
        event: { connect: { id: event.id } },
        trigger: 'some-event',
        country: 'gb',
      });

      const data = {
        trigger: 'some-event',
        country: 'gb',
        subject: 'Test Subject',
        body: 'Test body content',
      };

      await request()
        .post(`/api/v1/events/${event.id}/message-templates/`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(409);
    });

    it('should respond with 401 status code when unauthenticated', async () => {
      const event = await EventFactory.create();
      const data = {
        trigger: 'some-event',
        country: 'gb',
        subject: 'Test Subject',
        body: 'Test body content',
      };

      await request()
        .post(`/api/v1/events/${event.id}/message-templates/`)
        .send(data)
        .expect(401);
    });

    describe('files', () => {
      it('should respond with 201 status code when attachments are provided', async () => {
        const sessionId = crypto.randomUUID();
        const { event, accessToken } = await createEventWithManagerAndToken();
        const file1 = await FileFactory.create({
          field: sessionId,
        });
        const file2 = await FileFactory.create({
          field: sessionId,
        });

        const data = {
          trigger: 'some-event',
          country: 'gb',
          subject: 'Test Subject',
          body: 'Test body content',
          priority: 'high',
          attachmentIds: [file1.id, file2.id],
        };

        const { body } = await request()
          .post(`/api/v1/events/${event.id}/message-templates/`)
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
        const { event, accessToken } = await createEventWithManagerAndToken();
        const data = {
          trigger: 'some-event',
          country: 'gb',
          subject: 'Test Subject',
          body: 'Test body content',
          priority: 'high',
          attachmentIds: [],
        };

        await request()
          .post(`/api/v1/events/${event.id}/message-templates/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(201);
      });

      it('should respond with 400 status code when attachments are invalid', async () => {
        const sessionId = crypto.randomUUID();
        const { event, accessToken } = await createEventWithManagerAndToken();
        await FileFactory.create({
          field: sessionId,
        });

        const data = {
          trigger: 'some-event',
          country: 'gb',
          subject: 'Test Subject',
          body: 'Test body content',
          priority: 'high',
          attachmentIds: [crypto.randomUUID()],
        };

        await request()
          .post(`/api/v1/events/${event.id}/message-templates/`)
          .send(data)
          .setSessionId(sessionId)
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });

      it('should respond with 400 status code when attachments session id mismatch', async () => {
        const sessionId = crypto.randomUUID();
        const { event, accessToken } = await createEventWithManagerAndToken();
        const file1 = await FileFactory.create({
          field: crypto.randomUUID(),
        });
        const file2 = await FileFactory.create({
          field: sessionId,
        });

        const data = {
          trigger: 'some-event',
          country: 'gb',
          subject: 'Test Subject',
          body: 'Test body content',
          priority: 'high',
          attachmentIds: [file1.id, file2.id],
        };

        await request()
          .post(`/api/v1/events/${event.id}/message-templates/`)
          .send(data)
          .setSessionId(sessionId)
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });

      it('should respond with 400 status code when attachments are already assigned', async () => {
        const sessionId = crypto.randomUUID();
        const { event, accessToken } = await createEventWithManagerAndToken();
        const messageTemplate = await MessageTemplateFactory.create({
          event: { connect: { id: event.id } },
          trigger: 'some-event',
        });
        const file1 = await FileFactory.create({
          messageTemplate: { connect: { id: messageTemplate.id } },
          field: sessionId,
        });
        const file2 = await FileFactory.create({
          field: sessionId,
        });

        const data = {
          trigger: 'some-event',
          country: 'gb',
          subject: 'Test Subject',
          body: 'Test body content',
          priority: 'high',
          attachmentIds: [file1.id, file2.id],
        };

        await request()
          .post(`/api/v1/events/${event.id}/message-templates/`)
          .send(data)
          .setSessionId(sessionId)
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });
    });
  });

  describe('PATCH /api/v1/events/:eventId/message-templates/:messageTemplateId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with $expectedStatus status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } = await createEventWithManagerAndToken(
          undefined,
          role,
        );
        const messageTemplate = await MessageTemplateFactory.create({
          event: { connect: { id: event.id } },
          trigger: 'some-event',
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
              `/api/v1/events/${event.id}/message-templates/${messageTemplate.id}`,
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
              `/api/v1/events/${event.id}/message-templates/${messageTemplate.id}`,
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
        const { event, accessToken } = await createEventWithManagerAndToken();

        const messageTemplate = await MessageTemplateFactory.create({
          event: { connect: { id: event.id } },
          trigger: 'some-event',
        });

        await request()
          .patch(
            `/api/v1/events/${event.id}/message-templates/${messageTemplate.id}`,
          )
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(expected);
      },
    );

    it('should respond with 404 status code when message template does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const nonExistingId = ulid();
      const updateData = {
        subject: 'Updated Subject',
      };

      await request()
        .patch(`/api/v1/events/${event.id}/message-templates/${nonExistingId}`)
        .send(updateData)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with 403 status code when user is not event manager', async () => {
      const event = await EventFactory.create();
      const messageTemplate = await MessageTemplateFactory.create({
        event: { connect: { id: event.id } },
        trigger: 'some-event',
      });
      const updateData = {
        subject: 'Updated Subject',
      };
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .patch(
          `/api/v1/events/${event.id}/message-templates/${messageTemplate.id}`,
        )
        .send(updateData)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with 401 status code when unauthenticated', async () => {
      const event = await EventFactory.create();
      const messageTemplate = await MessageTemplateFactory.create({
        event: { connect: { id: event.id } },
        trigger: 'some-event',
      });
      const updateData = {
        subject: 'Updated Subject',
      };

      await request()
        .patch(
          `/api/v1/events/${event.id}/message-templates/${messageTemplate.id}`,
        )
        .send(updateData)
        .expect(401);
    });

    describe('files', () => {
      it('should respond with 200 status code when attachments are added', async () => {
        const sessionId = crypto.randomUUID();
        const { event, accessToken } = await createEventWithManagerAndToken();
        const messageTemplate = await MessageTemplateFactory.create({
          event: { connect: { id: event.id } },
          trigger: 'some-event',
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
            `/api/v1/events/${event.id}/message-templates/${messageTemplate.id}`,
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
        const { event, accessToken } = await createEventWithManagerAndToken();
        const messageTemplate = await MessageTemplateFactory.create({
          event: { connect: { id: event.id } },
          trigger: 'some-event',
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
            `/api/v1/events/${event.id}/message-templates/${messageTemplate.id}`,
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
        const { event, accessToken } = await createEventWithManagerAndToken();
        const messageTemplate = await MessageTemplateFactory.create({
          event: { connect: { id: event.id } },
          trigger: 'some-event',
        });

        const data = {
          attachmentIds: [],
        };

        const { body } = await request()
          .patch(
            `/api/v1/events/${event.id}/message-templates/${messageTemplate.id}`,
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
        const { event, accessToken } = await createEventWithManagerAndToken();
        const messageTemplate = await MessageTemplateFactory.create({
          event: { connect: { id: event.id } },
          trigger: 'some-event',
        });
        await FileFactory.create({
          field: sessionId,
        });

        const data = {
          attachmentIds: [crypto.randomUUID()],
        };

        await request()
          .patch(
            `/api/v1/events/${event.id}/message-templates/${messageTemplate.id}`,
          )
          .send(data)
          .setSessionId(sessionId)
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });

      it('should respond with 400 status code when attachments session id mismatch', async () => {
        const sessionId = crypto.randomUUID();
        const { event, accessToken } = await createEventWithManagerAndToken();
        const messageTemplate = await MessageTemplateFactory.create({
          event: { connect: { id: event.id } },
          trigger: 'some-event',
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
            `/api/v1/events/${event.id}/message-templates/${messageTemplate.id}`,
          )
          .send(data)
          .setSessionId(sessionId)
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });

      it('should respond with 400 status code when attachments are already assigned', async () => {
        const sessionId = crypto.randomUUID();
        const { event, accessToken } = await createEventWithManagerAndToken();
        const messageTemplate = await MessageTemplateFactory.create({
          event: { connect: { id: event.id } },
          trigger: 'some-event',
        });
        const file1 = await FileFactory.create({
          messageTemplate: { connect: { id: messageTemplate.id } },
          field: sessionId,
        });
        await MessageTemplateFactory.create({
          attachments: { connect: { id: file1.id } },
          event: { connect: { id: event.id } },
        });
        const file2 = await FileFactory.create({
          field: sessionId,
        });

        const data = {
          attachmentIds: [file1.id, file2.id],
        };

        await request()
          .patch(
            `/api/v1/events/${event.id}/message-templates/${messageTemplate.id}`,
          )
          .send(data)
          .setSessionId(sessionId)
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });
    });
  });

  describe('DELETE /api/v1/events/:eventId/message-templates/:messageTemplateId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 204 },
      { role: 'COORDINATOR', expectedStatus: 204 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with $expectedStatus status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } = await createEventWithManagerAndToken(
          undefined,
          role,
        );
        const messageTemplate = await MessageTemplateFactory.create({
          event: { connect: { id: event.id } },
          trigger: 'some-event',
        });

        await request()
          .delete(
            `/api/v1/events/${event.id}/message-templates/${messageTemplate.id}`,
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
      const { event, accessToken } = await createEventWithManagerAndToken();
      const nonExistingId = ulid();

      await request()
        .delete(`/api/v1/events/${event.id}/message-templates/${nonExistingId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with 403 status code when user is not event manager', async () => {
      const event = await EventFactory.create();
      const messageTemplate = await MessageTemplateFactory.create({
        event: { connect: { id: event.id } },
        trigger: 'some-event',
      });
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .delete(
          `/api/v1/events/${event.id}/message-templates/${messageTemplate.id}`,
        )
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with 401 status code when unauthenticated', async () => {
      const event = await EventFactory.create();
      const messageTemplate = await MessageTemplateFactory.create({
        event: { connect: { id: event.id } },
        trigger: 'some-event',
      });

      await request()
        .delete(
          `/api/v1/events/${event.id}/message-templates/${messageTemplate.id}`,
        )
        .send()
        .expect(401);
    });
  });
});

describe('/api/v1/files/', () => {
  const createMessageTemplateWithFile = async () => {
    const { user, accessToken, event } = await createEventWithManagerAndToken();
    const messageTemplate = await MessageTemplateFactory.create({
      event: { connect: { id: event.id } },
    });

    const fileName = crypto.randomUUID() + '.pdf';
    await uploadFile('blank.pdf', fileName);

    const file = await FileFactory.create({
      messageTemplate: { connect: { id: messageTemplate.id } },
      name: fileName,
    });

    return { file, user, accessToken, event, messageTemplate };
  };

  describe('GET /api/v1/files/:fileId', () => {
    it('should respond with `200` status code when user is event manager', async () => {
      const { file, accessToken } = await createMessageTemplateWithFile();

      await request()
        .get(`/api/v1/files/${file.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
    });

    it('should respond with `403` status code when user is not event manager', async () => {
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
