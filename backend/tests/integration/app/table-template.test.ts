import { describe, expect, it } from 'vitest';
import {
  CampFactory,
  CampManagerFactory,
  TableTemplateFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { ulid } from 'ulidx';
import { Camp } from '@prisma/client';

describe('/api/v1/camps/:campId/table-templates', () => {
  const createCampWithManagerAndToken = async (role = 'DIRECTOR') => {
    const camp = await CampFactory.create();
    const user = await UserFactory.create();
    const manager = await CampManagerFactory.create({
      camp: { connect: { id: camp.id } },
      user: { connect: { id: user.id } },
      role,
    });
    const accessToken = generateAccessToken(user);

    return {
      camp,
      user,
      manager,
      accessToken,
    };
  };

  const createTemplateWithCamp = async (camp: Camp) => {
    return TableTemplateFactory.create({
      camp: { connect: { id: camp.id } },
    });
  };

  describe('GET /api/v1/camps/:campId/table-templates', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 200 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);
        await createTemplateWithCamp(camp);

        const response = await request()
          .get(`/api/v1/camps/${camp.id}/table-templates`)
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

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/camps/${camp.id}/table-templates`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();

      await request()
        .get(`/api/v1/camps/${camp.id}/table-templates`)
        .send()
        .expect(401);
    });
  });

  describe('GET /api/v1/camps/:campId/table-templates/:templateId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 200 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);
        const template = await createTemplateWithCamp(camp);

        const response = await request()
          .get(`/api/v1/camps/${camp.id}/table-templates/${template.id}`)
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

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const template = await createTemplateWithCamp(camp);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/camps/${camp.id}/table-templates/${template.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const template = await createTemplateWithCamp(camp);

      await request()
        .get(`/api/v1/camps/${camp.id}/table-templates/${template.id}`)
        .send()
        .expect(401);
    });

    it('should respond with `404` status code when template id does not exist', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const templateId = ulid();

      await request()
        .get(`/api/v1/camps/${camp.id}/table-templates/${templateId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('POST /api/v1/camps/:campId/table-templates', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 201 },
      { role: 'COORDINATOR', expectedStatus: 201 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);

        const data = {
          title: 'Test Template',
          columns: [
            { name: 'name', label: 'Name', field: 'name' },
            { name: 'age', label: 'Age', field: 'age' },
          ],
          order: 1,
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/table-templates`)
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

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
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
        .post(`/api/v1/camps/${camp.id}/table-templates`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const count = await prisma.tableTemplate.count();
      expect(count).toBe(0);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();

      const data = {
        title: 'Test Template',
        columns: [
          { name: 'name', label: 'Name', field: 'name' },
          { name: 'age', label: 'Age', field: 'age' },
        ],
        order: 1,
      };

      await request()
        .post(`/api/v1/camps/${camp.id}/table-templates`)
        .send(data)
        .expect(401);

      const count = await prisma.tableTemplate.count();
      expect(count).toBe(0);
    });
  });

  describe('PATCH /api/v1/camps/:campId/table-templates/:templateId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);
        const template = await createTemplateWithCamp(camp);

        const data = {
          title: 'Updated Template',
          columns: [
            { name: 'name', label: 'Name', field: 'name' },
            { name: 'age', label: 'Age', field: 'age' },
          ],
          order: 1,
        };

        const response = await request()
          .put(`/api/v1/camps/${camp.id}/table-templates/${template.id}`)
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

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const template = await createTemplateWithCamp(camp);
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
        .put(`/api/v1/camps/${camp.id}/table-templates/${template.id}`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const template = await createTemplateWithCamp(camp);

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
        .put(`/api/v1/camps/${camp.id}/table-templates/${template.id}`)
        .send(data)
        .expect(401);
    });

    it('should respond with `404` status code when template id does not exist', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
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
        .patch(`/api/v1/camps/${camp.id}/table-templates/${templateId}`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/camps/:campId/table-templates/:templateId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 204 },
      { role: 'COORDINATOR', expectedStatus: 204 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);
        const template = await createTemplateWithCamp(camp);
        const otherTemplate = await createTemplateWithCamp(camp);

        await request()
          .delete(`/api/v1/camps/${camp.id}/table-templates/${template.id}`)
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

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const template = await createTemplateWithCamp(camp);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .delete(`/api/v1/camps/${camp.id}/table-templates/${template.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const count = await prisma.tableTemplate.count();
      expect(count).toBe(1);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const template = await createTemplateWithCamp(camp);

      await request()
        .delete(`/api/v1/camps/${camp.id}/table-templates/${template.id}`)
        .send()
        .expect(401);

      const count = await prisma.tableTemplate.count();
      expect(count).toBe(1);
    });

    it('should respond with `404` status code when template id does not exist', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const templateId = ulid();

      await request()
        .delete(`/api/v1/camps/${camp.id}/table-templates/${templateId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });
});
