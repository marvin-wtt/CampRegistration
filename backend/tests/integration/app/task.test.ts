import { describe, expect, it } from 'vitest';
import {
  CampFactory,
  CampManagerFactory,
  TaskFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { generateAccessToken } from './utils/token.js';
import { Camp, Task } from '#generated/prisma/client.js';
import { ulid } from 'ulidx';

describe('/api/v1/camps/:campId/tasks', () => {
  const createCampWithManagerAndToken = async (role = 'DIRECTOR') => {
    const camp = await CampFactory.create();
    const user = await UserFactory.create();
    const manager = await CampManagerFactory.create({
      camp: { connect: { id: camp.id } },
      user: { connect: { id: user.id } },
      role,
    });
    const accessToken = generateAccessToken(user);

    return { camp, user, manager, accessToken };
  };

  const createTaskForCamp = async (
    camp: Camp,
    data?: Partial<Parameters<typeof TaskFactory.create>[0]>,
  ): Promise<Task> => {
    return TaskFactory.create({
      camp: { connect: { id: camp.id } },
      ...data,
    });
  };

  describe('GET /api/v1/camps/:campId/tasks', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 200 },
    ])(
      'should respond with `$expectedStatus` when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);
        await createTaskForCamp(camp);

        const response = await request()
          .get(`/api/v1/camps/${camp.id}/tasks`)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('title');
        expect(response.body.data[0]).toHaveProperty('notes');
        expect(response.body.data[0]).toHaveProperty('dueDate');
        expect(response.body.data[0]).toHaveProperty('completed');
        expect(response.body.data[0]).toHaveProperty('assigneeId');
      },
    );

    it('should only return tasks belonging to the requested camp', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const otherCamp = await CampFactory.create();

      await createTaskForCamp(camp);
      await createTaskForCamp(camp);
      await createTaskForCamp(otherCamp);

      const response = await request()
        .get(`/api/v1/camps/${camp.id}/tasks`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
    });

    it('should return `200` with empty array when camp has no tasks', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      const response = await request()
        .get(`/api/v1/camps/${camp.id}/tasks`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });

    it('should respond with `403` when user is not a camp manager', async () => {
      const camp = await CampFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/camps/${camp.id}/tasks`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const camp = await CampFactory.create();

      await request().get(`/api/v1/camps/${camp.id}/tasks`).expect(401);
    });
  });

  describe('GET /api/v1/camps/:campId/tasks/:taskId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 200 },
    ])(
      'should respond with `$expectedStatus` when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);
        const task = await createTaskForCamp(camp);

        const response = await request()
          .get(`/api/v1/camps/${camp.id}/tasks/${task.id}`)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        expect(response.body).toHaveProperty('data.id', task.id);
        expect(response.body).toHaveProperty('data.title');
        expect(response.body).toHaveProperty('data.completed');
      },
    );

    it('should respond with `404` when the task does not exist', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      await request()
        .get(`/api/v1/camps/${camp.id}/tasks/${ulid()}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `404` when the task belongs to a different camp', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const otherCamp = await CampFactory.create();
      const task = await createTaskForCamp(otherCamp);

      await request()
        .get(`/api/v1/camps/${camp.id}/tasks/${task.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `403` when user is not a camp manager', async () => {
      const camp = await CampFactory.create();
      const task = await createTaskForCamp(camp);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/camps/${camp.id}/tasks/${task.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const task = await createTaskForCamp(camp);

      await request()
        .get(`/api/v1/camps/${camp.id}/tasks/${task.id}`)
        .expect(401);
    });
  });

  describe('POST /api/v1/camps/:campId/tasks', () => {
    const validPayload = {
      title: 'Book transportation',
      notes: 'Reserve the bus',
      dueDate: '2025-07-15',
    };

    it.each([
      { role: 'DIRECTOR', expectedStatus: 201 },
      { role: 'COORDINATOR', expectedStatus: 201 },
      { role: 'COUNSELOR', expectedStatus: 201 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);

        await request()
          .post(`/api/v1/camps/${camp.id}/tasks`)
          .send(validPayload)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        const count = await prisma.task.count();
        if (expectedStatus === 201) {
          expect(count).toBe(1);
        } else {
          expect(count).toBe(0);
        }
      },
    );

    it('should create a task with all fields', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/tasks`)
        .send(validPayload)
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.id');
      expect(body).toHaveProperty('data.title', validPayload.title);
      expect(body).toHaveProperty('data.notes', validPayload.notes);
      expect(body).toHaveProperty('data.dueDate', validPayload.dueDate);
      expect(body).toHaveProperty('data.assigneeId', null);
    });

    it('should create a task with only a title', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/tasks`)
        .send({ title: 'Minimal Task' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.title', 'Minimal Task');
      expect(body).toHaveProperty('data.notes', null);
      expect(body).toHaveProperty('data.dueDate', null);
    });

    it('should always create a task as not completed', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/tasks`)
        // `completed` is not part of the create schema and must be ignored
        .send({ title: 'New Task', completed: true })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.completed', false);
    });

    it('should create a task assigned to a manager of the same camp', async () => {
      const { camp, accessToken, manager } =
        await createCampWithManagerAndToken();

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/tasks`)
        .send({ title: 'Assigned Task', assigneeId: manager.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.assigneeId', manager.id);
    });

    it('should respond with `400` when the assignee belongs to another camp', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const otherCamp = await CampFactory.create();
      const otherManager = await CampManagerFactory.create({
        camp: { connect: { id: otherCamp.id } },
        user: { connect: { id: (await UserFactory.create()).id } },
      });

      await request()
        .post(`/api/v1/camps/${camp.id}/tasks`)
        .send({ title: 'Bad Assignee', assigneeId: otherManager.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      const count = await prisma.task.count();
      expect(count).toBe(0);
    });

    it.each([
      { label: 'title is missing', data: {} },
      { label: 'title is empty', data: { title: '' } },
      {
        label: 'dueDate format is invalid',
        data: { title: 'T', dueDate: '15-07-2025' },
      },
      {
        label: 'dueDate is not a real date',
        data: { title: 'T', dueDate: '2025-02-30' },
      },
      {
        label: 'assigneeId is not a ulid',
        data: { title: 'T', assigneeId: 'not-a-ulid' },
      },
    ])('should respond with `400` when $label', async ({ data }) => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      await request()
        .post(`/api/v1/camps/${camp.id}/tasks`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      const count = await prisma.task.count();
      expect(count).toBe(0);
    });

    it('should respond with `403` when user is not a camp manager', async () => {
      const camp = await CampFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .post(`/api/v1/camps/${camp.id}/tasks`)
        .send(validPayload)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const count = await prisma.task.count();
      expect(count).toBe(0);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const camp = await CampFactory.create();

      await request()
        .post(`/api/v1/camps/${camp.id}/tasks`)
        .send(validPayload)
        .expect(401);

      const count = await prisma.task.count();
      expect(count).toBe(0);
    });
  });

  describe('PATCH /api/v1/camps/:campId/tasks/:taskId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);
        const task = await createTaskForCamp(camp);

        await request()
          .patch(`/api/v1/camps/${camp.id}/tasks/${task.id}`)
          .send({ title: 'Updated Title' })
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);
      },
    );

    it('should update all fields', async () => {
      const { camp, accessToken, manager } =
        await createCampWithManagerAndToken();
      const task = await createTaskForCamp(camp);

      const update = {
        title: 'Updated Title',
        notes: 'Updated notes',
        dueDate: '2025-08-01',
        completed: true,
        assigneeId: manager.id,
      };

      const { body } = await request()
        .patch(`/api/v1/camps/${camp.id}/tasks/${task.id}`)
        .send(update)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.id', task.id);
      expect(body).toHaveProperty('data.title', update.title);
      expect(body).toHaveProperty('data.notes', update.notes);
      expect(body).toHaveProperty('data.dueDate', update.dueDate);
      expect(body).toHaveProperty('data.completed', true);
      expect(body).toHaveProperty('data.assigneeId', manager.id);
    });

    it('should mark a task as completed', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const task = await createTaskForCamp(camp, { completed: false });

      const { body } = await request()
        .patch(`/api/v1/camps/${camp.id}/tasks/${task.id}`)
        .send({ completed: true })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.completed', true);
    });

    it('should clear nullable fields when set to null', async () => {
      const { camp, accessToken, manager } =
        await createCampWithManagerAndToken();
      const task = await createTaskForCamp(camp, {
        notes: 'Some notes',
        dueDate: '2025-07-10',
        assignee: { connect: { id: manager.id } },
      });

      const { body } = await request()
        .patch(`/api/v1/camps/${camp.id}/tasks/${task.id}`)
        .send({ notes: null, dueDate: null, assigneeId: null })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.notes', null);
      expect(body).toHaveProperty('data.dueDate', null);
      expect(body).toHaveProperty('data.assigneeId', null);
    });

    it('should respond with `400` when the assignee belongs to another camp', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const task = await createTaskForCamp(camp);
      const otherCamp = await CampFactory.create();
      const otherManager = await CampManagerFactory.create({
        camp: { connect: { id: otherCamp.id } },
        user: { connect: { id: (await UserFactory.create()).id } },
      });

      await request()
        .patch(`/api/v1/camps/${camp.id}/tasks/${task.id}`)
        .send({ assigneeId: otherManager.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `404` when the task does not exist', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      await request()
        .patch(`/api/v1/camps/${camp.id}/tasks/${ulid()}`)
        .send({ title: 'Updated' })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `404` when the task belongs to a different camp', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const otherCamp = await CampFactory.create();
      const task = await createTaskForCamp(otherCamp);

      await request()
        .patch(`/api/v1/camps/${camp.id}/tasks/${task.id}`)
        .send({ title: 'Updated' })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it.each([
      { label: 'title is empty', data: { title: '' } },
      { label: 'dueDate format is invalid', data: { dueDate: '2025/07/15' } },
      { label: 'completed is not a boolean', data: { completed: 'yes' } },
    ])('should respond with `400` when $label', async ({ data }) => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const task = await createTaskForCamp(camp);

      await request()
        .patch(`/api/v1/camps/${camp.id}/tasks/${task.id}`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `403` when user is not a camp manager', async () => {
      const camp = await CampFactory.create();
      const task = await createTaskForCamp(camp);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .patch(`/api/v1/camps/${camp.id}/tasks/${task.id}`)
        .send({ title: 'Updated' })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const task = await createTaskForCamp(camp);

      await request()
        .patch(`/api/v1/camps/${camp.id}/tasks/${task.id}`)
        .send({ title: 'Updated' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/camps/:campId/tasks/:taskId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 204 },
      { role: 'COORDINATOR', expectedStatus: 204 },
      { role: 'COUNSELOR', expectedStatus: 204 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);
        const task = await createTaskForCamp(camp);
        const otherTask = await createTaskForCamp(camp);

        await request()
          .delete(`/api/v1/camps/${camp.id}/tasks/${task.id}`)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        const count = await prisma.task.count();
        if (expectedStatus === 204) {
          expect(count).toBe(1);
          const remaining = await prisma.task.findFirst();
          expect(remaining?.id).toBe(otherTask.id);
        } else {
          expect(count).toBe(2);
        }
      },
    );

    it('should respond with `404` when the task does not exist', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      await request()
        .delete(`/api/v1/camps/${camp.id}/tasks/${ulid()}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `404` when the task belongs to a different camp', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const otherCamp = await CampFactory.create();
      const task = await createTaskForCamp(otherCamp);

      await request()
        .delete(`/api/v1/camps/${camp.id}/tasks/${task.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);

      const count = await prisma.task.count();
      expect(count).toBe(1);
    });

    it('should respond with `403` when user is not a camp manager', async () => {
      const camp = await CampFactory.create();
      const task = await createTaskForCamp(camp);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .delete(`/api/v1/camps/${camp.id}/tasks/${task.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const count = await prisma.task.count();
      expect(count).toBe(1);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const task = await createTaskForCamp(camp);

      await request()
        .delete(`/api/v1/camps/${camp.id}/tasks/${task.id}`)
        .expect(401);

      const count = await prisma.task.count();
      expect(count).toBe(1);
    });
  });
});
