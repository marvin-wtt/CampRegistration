import { describe, expect, it } from 'vitest';
import {
  EventFactory,
  EventManagerFactory,
  TaskFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { generateAccessToken } from './utils/token.js';
import { Event, Task } from '#generated/prisma/client.js';
import { ulid } from 'ulidx';

describe('/api/v1/events/:eventId/tasks', () => {
  const createEventWithManagerAndToken = async (role = 'DIRECTOR') => {
    const event = await EventFactory.create();
    const user = await UserFactory.create();
    const manager = await EventManagerFactory.create({
      event: { connect: { id: event.id } },
      user: { connect: { id: user.id } },
      role,
    });
    const accessToken = generateAccessToken(user);

    return { event, user, manager, accessToken };
  };

  const createTaskForEvent = async (
    event: Event,
    data?: Partial<Parameters<typeof TaskFactory.create>[0]>,
  ): Promise<Task> => {
    return TaskFactory.create({
      event: { connect: { id: event.id } },
      ...data,
    });
  };

  describe('GET /api/v1/events/:eventId/tasks', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 200 },
    ])(
      'should respond with `$expectedStatus` when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } =
          await createEventWithManagerAndToken(role);
        await createTaskForEvent(event);

        const response = await request()
          .get(`/api/v1/events/${event.id}/tasks`)
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
        expect(response.body.data[0]).toHaveProperty('assignee');
      },
    );

    // Embedded so a client can name the assignee without fetching the roster.
    it('should embed the assignee', async () => {
      const { event, user, manager, accessToken } =
        await createEventWithManagerAndToken();
      await createTaskForEvent(event, {
        assignee: { connect: { id: manager.id } },
      });

      const response = await request()
        .get(`/api/v1/events/${event.id}/tasks`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(response.body.data[0]).toHaveProperty('assignee', {
        id: manager.id,
        name: user.name,
        email: user.email,
      });
    });

    it('should embed a `null` assignee for unassigned tasks', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      await createTaskForEvent(event);

      const response = await request()
        .get(`/api/v1/events/${event.id}/tasks`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(response.body.data[0]).toHaveProperty('assignee', null);
    });

    it('should only return tasks belonging to the requested event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const otherEvent = await EventFactory.create();

      await createTaskForEvent(event);
      await createTaskForEvent(event);
      await createTaskForEvent(otherEvent);

      const response = await request()
        .get(`/api/v1/events/${event.id}/tasks`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
    });

    it('should return `200` with empty array when event has no tasks', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      const response = await request()
        .get(`/api/v1/events/${event.id}/tasks`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });

    it('should respond with `403` when user is not a event manager', async () => {
      const event = await EventFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/events/${event.id}/tasks`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const event = await EventFactory.create();

      await request().get(`/api/v1/events/${event.id}/tasks`).expect(401);
    });
  });

  describe('GET /api/v1/events/:eventId/tasks/:taskId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 200 },
    ])(
      'should respond with `$expectedStatus` when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } =
          await createEventWithManagerAndToken(role);
        const task = await createTaskForEvent(event);

        const response = await request()
          .get(`/api/v1/events/${event.id}/tasks/${task.id}`)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        expect(response.body).toHaveProperty('data.id', task.id);
        expect(response.body).toHaveProperty('data.title');
        expect(response.body).toHaveProperty('data.completed');
      },
    );

    it('should respond with `404` when the task does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .get(`/api/v1/events/${event.id}/tasks/${ulid()}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `404` when the task belongs to a different event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const otherEvent = await EventFactory.create();
      const task = await createTaskForEvent(otherEvent);

      await request()
        .get(`/api/v1/events/${event.id}/tasks/${task.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `403` when user is not a event manager', async () => {
      const event = await EventFactory.create();
      const task = await createTaskForEvent(event);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/events/${event.id}/tasks/${task.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const event = await EventFactory.create();
      const task = await createTaskForEvent(event);

      await request()
        .get(`/api/v1/events/${event.id}/tasks/${task.id}`)
        .expect(401);
    });
  });

  describe('POST /api/v1/events/:eventId/tasks', () => {
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
        const { event, accessToken } =
          await createEventWithManagerAndToken(role);

        await request()
          .post(`/api/v1/events/${event.id}/tasks`)
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
      const { event, accessToken } = await createEventWithManagerAndToken();

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/tasks`)
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
      const { event, accessToken } = await createEventWithManagerAndToken();

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/tasks`)
        .send({ title: 'Minimal Task' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.title', 'Minimal Task');
      expect(body).toHaveProperty('data.notes', null);
      expect(body).toHaveProperty('data.dueDate', null);
    });

    it('should always create a task as not completed', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/tasks`)
        // `completed` is not part of the create schema and must be ignored
        .send({ title: 'New Task', completed: true })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.completed', false);
    });

    it('should create a task assigned to a manager of the same event', async () => {
      const { event, accessToken, manager } =
        await createEventWithManagerAndToken();

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/tasks`)
        .send({ title: 'Assigned Task', assigneeId: manager.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.assigneeId', manager.id);
    });

    it('should respond with `400` when the assignee belongs to another event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const otherEvent = await EventFactory.create();
      const otherManager = await EventManagerFactory.create({
        event: { connect: { id: otherEvent.id } },
        user: { connect: { id: (await UserFactory.create()).id } },
      });

      await request()
        .post(`/api/v1/events/${event.id}/tasks`)
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
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .post(`/api/v1/events/${event.id}/tasks`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      const count = await prisma.task.count();
      expect(count).toBe(0);
    });

    it('should respond with `403` when user is not a event manager', async () => {
      const event = await EventFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .post(`/api/v1/events/${event.id}/tasks`)
        .send(validPayload)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const count = await prisma.task.count();
      expect(count).toBe(0);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const event = await EventFactory.create();

      await request()
        .post(`/api/v1/events/${event.id}/tasks`)
        .send(validPayload)
        .expect(401);

      const count = await prisma.task.count();
      expect(count).toBe(0);
    });
  });

  describe('PATCH /api/v1/events/:eventId/tasks/:taskId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } =
          await createEventWithManagerAndToken(role);
        const task = await createTaskForEvent(event);

        await request()
          .patch(`/api/v1/events/${event.id}/tasks/${task.id}`)
          .send({ title: 'Updated Title' })
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);
      },
    );

    it('should update all fields', async () => {
      const { event, accessToken, manager } =
        await createEventWithManagerAndToken();
      const task = await createTaskForEvent(event);

      const update = {
        title: 'Updated Title',
        notes: 'Updated notes',
        dueDate: '2025-08-01',
        completed: true,
        assigneeId: manager.id,
      };

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/tasks/${task.id}`)
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
      const { event, accessToken } = await createEventWithManagerAndToken();
      const task = await createTaskForEvent(event, { completed: false });

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/tasks/${task.id}`)
        .send({ completed: true })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.completed', true);
    });

    it('should clear nullable fields when set to null', async () => {
      const { event, accessToken, manager } =
        await createEventWithManagerAndToken();
      const task = await createTaskForEvent(event, {
        notes: 'Some notes',
        dueDate: '2025-07-10',
        assignee: { connect: { id: manager.id } },
      });

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/tasks/${task.id}`)
        .send({ notes: null, dueDate: null, assigneeId: null })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.notes', null);
      expect(body).toHaveProperty('data.dueDate', null);
      expect(body).toHaveProperty('data.assigneeId', null);
    });

    it('should respond with `400` when the assignee belongs to another event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const task = await createTaskForEvent(event);
      const otherEvent = await EventFactory.create();
      const otherManager = await EventManagerFactory.create({
        event: { connect: { id: otherEvent.id } },
        user: { connect: { id: (await UserFactory.create()).id } },
      });

      await request()
        .patch(`/api/v1/events/${event.id}/tasks/${task.id}`)
        .send({ assigneeId: otherManager.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `404` when the task does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .patch(`/api/v1/events/${event.id}/tasks/${ulid()}`)
        .send({ title: 'Updated' })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `404` when the task belongs to a different event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const otherEvent = await EventFactory.create();
      const task = await createTaskForEvent(otherEvent);

      await request()
        .patch(`/api/v1/events/${event.id}/tasks/${task.id}`)
        .send({ title: 'Updated' })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it.each([
      { label: 'title is empty', data: { title: '' } },
      { label: 'dueDate format is invalid', data: { dueDate: '2025/07/15' } },
      { label: 'completed is not a boolean', data: { completed: 'yes' } },
    ])('should respond with `400` when $label', async ({ data }) => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const task = await createTaskForEvent(event);

      await request()
        .patch(`/api/v1/events/${event.id}/tasks/${task.id}`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `403` when user is not a event manager', async () => {
      const event = await EventFactory.create();
      const task = await createTaskForEvent(event);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .patch(`/api/v1/events/${event.id}/tasks/${task.id}`)
        .send({ title: 'Updated' })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const event = await EventFactory.create();
      const task = await createTaskForEvent(event);

      await request()
        .patch(`/api/v1/events/${event.id}/tasks/${task.id}`)
        .send({ title: 'Updated' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/events/:eventId/tasks/:taskId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 204 },
      { role: 'COORDINATOR', expectedStatus: 204 },
      { role: 'COUNSELOR', expectedStatus: 204 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } =
          await createEventWithManagerAndToken(role);
        const task = await createTaskForEvent(event);
        const otherTask = await createTaskForEvent(event);

        await request()
          .delete(`/api/v1/events/${event.id}/tasks/${task.id}`)
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
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .delete(`/api/v1/events/${event.id}/tasks/${ulid()}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `404` when the task belongs to a different event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const otherEvent = await EventFactory.create();
      const task = await createTaskForEvent(otherEvent);

      await request()
        .delete(`/api/v1/events/${event.id}/tasks/${task.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);

      const count = await prisma.task.count();
      expect(count).toBe(1);
    });

    it('should respond with `403` when user is not a event manager', async () => {
      const event = await EventFactory.create();
      const task = await createTaskForEvent(event);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .delete(`/api/v1/events/${event.id}/tasks/${task.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const count = await prisma.task.count();
      expect(count).toBe(1);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const event = await EventFactory.create();
      const task = await createTaskForEvent(event);

      await request()
        .delete(`/api/v1/events/${event.id}/tasks/${task.id}`)
        .expect(401);

      const count = await prisma.task.count();
      expect(count).toBe(1);
    });
  });
});
