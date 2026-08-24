import { describe, expect, it } from 'vitest';
import {
  EventFactory,
  EventManagerFactory,
  TableTemplateFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { ulid } from 'ulidx';
import { Event } from '#generated/prisma/client.js';

describe('/api/v1/events/:eventId/table-templates', () => {
  const createEventWithManagerAndToken = async (role = 'DIRECTOR') => {
    const event = await EventFactory.create();
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

  const createTemplateWithEvent = async (event: Event) => {
    return TableTemplateFactory.create({
      event: { connect: { id: event.id } },
    });
  };

  describe('GET /api/v1/events/:eventId/table-templates', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 200 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } =
          await createEventWithManagerAndToken(role);
        await createTemplateWithEvent(event);

        const response = await request()
          .get(`/api/v1/events/${event.id}/table-templates`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 200) {
          expect(response.body).toHaveProperty('data');
          expect(response.body.data).toHaveLength(1);
          expect(response.body.data[0]).toHaveProperty('id');
          expect(response.body.data[0]).toHaveProperty('title');
          expect(response.body.data[0]).toHaveProperty('columns');
        }
      },
    );

    it('should respond with `403` status code when user is not event manager', async () => {
      const event = await EventFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/events/${event.id}/table-templates`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const event = await EventFactory.create();

      await request()
        .get(`/api/v1/events/${event.id}/table-templates`)
        .send()
        .expect(401);
    });
  });

  describe('GET /api/v1/events/:eventId/table-templates/:templateId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 200 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } =
          await createEventWithManagerAndToken(role);
        const template = await createTemplateWithEvent(event);

        const response = await request()
          .get(`/api/v1/events/${event.id}/table-templates/${template.id}`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 200) {
          expect(response.body).toHaveProperty('data');
          expect(response.body.data).toHaveProperty('id', template.id);
          expect(response.body.data).toHaveProperty('title');
          expect(response.body.data).toHaveProperty('columns');
        }
      },
    );

    it('should respond with `403` status code when user is not event manager', async () => {
      const event = await EventFactory.create();
      const template = await createTemplateWithEvent(event);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/events/${event.id}/table-templates/${template.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const event = await EventFactory.create();
      const template = await createTemplateWithEvent(event);

      await request()
        .get(`/api/v1/events/${event.id}/table-templates/${template.id}`)
        .send()
        .expect(401);
    });

    it('should respond with `404` status code when template id does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const templateId = ulid();

      await request()
        .get(`/api/v1/events/${event.id}/table-templates/${templateId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('POST /api/v1/events/:eventId/table-templates', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 201 },
      { role: 'COORDINATOR', expectedStatus: 201 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } =
          await createEventWithManagerAndToken(role);

        const data = {
          title: 'Test Template',
          columns: [
            { name: 'name', label: 'Name', field: 'name' },
            { name: 'age', label: 'Age', field: 'age' },
          ],
          order: 1,
        };

        await request()
          .post(`/api/v1/events/${event.id}/table-templates`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 201) {
          const templateCount = await prisma.tableTemplate.count();
          expect(templateCount).toBeGreaterThan(0);
        } else {
          const templateCount = await prisma.tableTemplate.count();
          expect(templateCount).toBe(0);
        }
      },
    );

    it('should respond with `403` status code when user is not event manager', async () => {
      const event = await EventFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      const data = {
        title: 'Test Template',
        columns: [
          { name: 'name', label: 'Name', field: 'name' },
          { name: 'age', label: 'Age', field: 'age' },
        ],
        order: 1,
      };

      await request()
        .post(`/api/v1/events/${event.id}/table-templates`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const count = await prisma.tableTemplate.count();
      expect(count).toBe(0);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const event = await EventFactory.create();

      const data = {
        title: 'Test Template',
        columns: [
          { name: 'name', label: 'Name', field: 'name' },
          { name: 'age', label: 'Age', field: 'age' },
        ],
        order: 1,
      };

      await request()
        .post(`/api/v1/events/${event.id}/table-templates`)
        .send(data)
        .expect(401);

      const count = await prisma.tableTemplate.count();
      expect(count).toBe(0);
    });

    it('should store the print orientation', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      const data = {
        title: 'Test Template',
        columns: [{ name: 'name', label: 'Name', field: 'name' }],
        order: 1,
        printOptions: { orientation: 'landscape' },
      };

      const response = await request()
        .post(`/api/v1/events/${event.id}/table-templates`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(response.body.data).toHaveProperty(
        'printOptions.orientation',
        'landscape',
      );

      const stored = await request()
        .get(
          `/api/v1/events/${event.id}/table-templates/${response.body.data.id}`,
        )
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(stored.body.data).toHaveProperty(
        'printOptions.orientation',
        'landscape',
      );
    });
  });

  describe('PATCH /api/v1/events/:eventId/table-templates/:templateId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } =
          await createEventWithManagerAndToken(role);
        const template = await createTemplateWithEvent(event);

        const data = {
          title: 'Updated Template',
          columns: [
            { name: 'name', label: 'Name', field: 'name' },
            { name: 'age', label: 'Age', field: 'age' },
          ],
          order: 1,
        };

        const response = await request()
          .put(`/api/v1/events/${event.id}/table-templates/${template.id}`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 200) {
          expect(response.body).toHaveProperty('data');
          expect(response.body.data).toHaveProperty(
            'title',
            'Updated Template',
          );
          expect(response.body.data.columns).toHaveLength(2);

          const updatedTemplate = await prisma.tableTemplate.findFirst();
          expect(updatedTemplate).toBeDefined();
          expect(updatedTemplate?.data).toHaveProperty(
            'title',
            'Updated Template',
          );
        }
      },
    );

    it('should respond with `403` status code when user is not event manager', async () => {
      const event = await EventFactory.create();
      const template = await createTemplateWithEvent(event);
      const accessToken = generateAccessToken(await UserFactory.create());

      const data = {
        title: 'Updated Template',
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'age', label: 'Age' },
          { key: 'email', label: 'Email' },
        ],
        order: 1,
      };

      await request()
        .put(`/api/v1/events/${event.id}/table-templates/${template.id}`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const event = await EventFactory.create();
      const template = await createTemplateWithEvent(event);

      const data = {
        title: 'Updated Template',
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'age', label: 'Age' },
          { key: 'email', label: 'Email' },
        ],
        order: 1,
      };

      await request()
        .put(`/api/v1/events/${event.id}/table-templates/${template.id}`)
        .send(data)
        .expect(401);
    });

    it('should respond with `404` status code when template id does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const templateId = ulid();

      const data = {
        title: 'Updated Template',
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'age', label: 'Age' },
          { key: 'email', label: 'Email' },
        ],
        order: 1,
      };

      await request()
        .patch(`/api/v1/events/${event.id}/table-templates/${templateId}`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should drop the print orientation when it is omitted', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const template = await TableTemplateFactory.create({
        event: { connect: { id: event.id } },
        data: {
          title: 'Test Template',
          columns: [{ name: 'name', label: 'Name', field: 'name' }],
          order: 1,
          printOptions: { orientation: 'landscape' },
        },
      });

      const response = await request()
        .put(`/api/v1/events/${event.id}/table-templates/${template.id}`)
        .send({
          title: 'Test Template',
          columns: [{ name: 'name', label: 'Name', field: 'name' }],
          order: 1,
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(response.body.data.printOptions).toBeUndefined();
    });
  });

  describe('DELETE /api/v1/events/:eventId/table-templates/:templateId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 204 },
      { role: 'COORDINATOR', expectedStatus: 204 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } =
          await createEventWithManagerAndToken(role);
        const template = await createTemplateWithEvent(event);
        const otherTemplate = await createTemplateWithEvent(event);

        await request()
          .delete(`/api/v1/events/${event.id}/table-templates/${template.id}`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 204) {
          const count = await prisma.tableTemplate.count();
          expect(count).toBe(1);

          const remainingTemplate = await prisma.tableTemplate.findFirst();
          expect(remainingTemplate?.id).toBe(otherTemplate.id);
        } else {
          const count = await prisma.tableTemplate.count();
          expect(count).toBe(2);
        }
      },
    );

    it('should respond with `403` status code when user is not event manager', async () => {
      const event = await EventFactory.create();
      const template = await createTemplateWithEvent(event);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .delete(`/api/v1/events/${event.id}/table-templates/${template.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const count = await prisma.tableTemplate.count();
      expect(count).toBe(1);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const event = await EventFactory.create();
      const template = await createTemplateWithEvent(event);

      await request()
        .delete(`/api/v1/events/${event.id}/table-templates/${template.id}`)
        .send()
        .expect(401);

      const count = await prisma.tableTemplate.count();
      expect(count).toBe(1);
    });

    it('should respond with `404` status code when template id does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const templateId = ulid();

      await request()
        .delete(`/api/v1/events/${event.id}/table-templates/${templateId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });
});
