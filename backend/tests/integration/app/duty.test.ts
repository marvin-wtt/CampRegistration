import { describe, expect, it } from 'vitest';
import {
  DutyFactory,
  EventFactory,
  EventManagerFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { generateAccessToken } from './utils/token.js';
import { Event, Duty } from '#generated/prisma/client.js';
import { ulid } from 'ulidx';

describe('/api/v1/events/:eventId/duties', () => {
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

  const createDutyForEvent = async (
    event: Event,
    data?: Partial<Parameters<typeof DutyFactory.create>[0]>,
  ): Promise<Duty> => {
    return DutyFactory.create({
      event: { connect: { id: event.id } },
      ...data,
    });
  };

  describe('GET /api/v1/events/:eventId/duties', () => {
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
        await createDutyForEvent(event);

        const response = await request()
          .get(`/api/v1/events/${event.id}/duties`)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('name');
        expect(response.body.data[0]).toHaveProperty('sortOrder');
        expect(response.body.data[0]).toHaveProperty('rotationUnit');
      },
    );

    it('should only return duties belonging to the requested event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const otherEvent = await EventFactory.create();

      await createDutyForEvent(event);
      await createDutyForEvent(otherEvent);

      const response = await request()
        .get(`/api/v1/events/${event.id}/duties`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });

    it('should respond with `403` when user is not a event manager', async () => {
      const event = await EventFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/events/${event.id}/duties`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const event = await EventFactory.create();

      await request().get(`/api/v1/events/${event.id}/duties`).expect(401);
    });
  });

  describe('POST /api/v1/events/:eventId/duties', () => {
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
          .post(`/api/v1/events/${event.id}/duties`)
          .send({ name: 'Kitchen' })
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        const count = await prisma.duty.count();
        expect(count).toBe(expectedStatus === 201 ? 1 : 0);
      },
    );

    it('should default rotationUnit to PARTICIPANT', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/duties`)
        .send({ name: 'Kitchen' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.rotationUnit', 'PARTICIPANT');
    });

    it('should create a duty with an explicit rotationUnit', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/duties`)
        .send({ name: 'Kitchen', rotationUnit: 'ROOM' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.rotationUnit', 'ROOM');
    });

    it('should accept a translated name', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const name = { en: 'Kitchen', de: 'Küche' };

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/duties`)
        .send({ name })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.name', name);
    });

    it('should default defaultCount to null', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/duties`)
        .send({ name: 'Kitchen' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.defaultCount', null);
    });

    it('should create a duty with a defaultCount', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/duties`)
        .send({ name: 'Kitchen', defaultCount: 3 })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.defaultCount', 3);
    });

    it.each([
      { label: 'name is missing', data: {} },
      { label: 'name is empty', data: { name: '' } },
      {
        label: 'rotationUnit is invalid',
        data: { name: 'Kitchen', rotationUnit: 'GROUP' },
      },
      {
        label: 'defaultCount is zero',
        data: { name: 'Kitchen', defaultCount: 0 },
      },
      {
        label: 'defaultCount is negative',
        data: { name: 'Kitchen', defaultCount: -1 },
      },
    ])('should respond with `400` when $label', async ({ data }) => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .post(`/api/v1/events/${event.id}/duties`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const event = await EventFactory.create();

      await request()
        .post(`/api/v1/events/${event.id}/duties`)
        .send({ name: 'Kitchen' })
        .expect(401);
    });
  });

  describe('PATCH /api/v1/events/:eventId/duties/:dutyId', () => {
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
        const duty = await createDutyForEvent(event);

        await request()
          .patch(`/api/v1/events/${event.id}/duties/${duty.id}`)
          .send({ name: 'Updated' })
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);
      },
    );

    it('should update the name, sortOrder and rotationUnit', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const duty = await createDutyForEvent(event, {
        rotationUnit: 'PARTICIPANT',
      });

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/duties/${duty.id}`)
        .send({ name: 'Dishwashing', sortOrder: 2, rotationUnit: 'ROOM' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.name', 'Dishwashing');
      expect(body).toHaveProperty('data.sortOrder', 2);
      expect(body).toHaveProperty('data.rotationUnit', 'ROOM');
    });

    it('should update the defaultCount', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const duty = await createDutyForEvent(event);

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/duties/${duty.id}`)
        .send({ defaultCount: 4 })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.defaultCount', 4);
    });

    it('should clear the defaultCount when set to null', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const duty = await createDutyForEvent(event, { defaultCount: 4 });

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/duties/${duty.id}`)
        .send({ defaultCount: null })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.defaultCount', null);
    });

    it('should respond with `404` when the duty does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .patch(`/api/v1/events/${event.id}/duties/${ulid()}`)
        .send({ name: 'Updated' })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `404` when the duty belongs to a different event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const otherEvent = await EventFactory.create();
      const duty = await createDutyForEvent(otherEvent);

      await request()
        .patch(`/api/v1/events/${event.id}/duties/${duty.id}`)
        .send({ name: 'Updated' })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/events/:eventId/duties/:dutyId', () => {
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
        const duty = await createDutyForEvent(event);

        await request()
          .delete(`/api/v1/events/${event.id}/duties/${duty.id}`)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        const count = await prisma.duty.count();
        expect(count).toBe(expectedStatus === 204 ? 0 : 1);
      },
    );

    it('should cascade-delete its assignments', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const duty = await createDutyForEvent(event);
      await prisma.dutyAssignment.create({
        data: { eventId: event.id, dutyId: duty.id, date: '2026-08-31' },
      });

      await request()
        .delete(`/api/v1/events/${event.id}/duties/${duty.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      const count = await prisma.dutyAssignment.count();
      expect(count).toBe(0);
    });

    it('should respond with `404` when the duty does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .delete(`/api/v1/events/${event.id}/duties/${ulid()}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });
});
