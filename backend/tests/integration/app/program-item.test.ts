import { describe, expect, it } from 'vitest';
import {
  EventFactory,
  EventManagerFactory,
  ProgramItemFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { generateAccessToken } from './utils/token.js';
import { Event, ProgramItem } from '#generated/prisma/client.js';
import { ulid } from 'ulidx';

describe('/api/v1/events/:eventId/program-items', () => {
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

  const createEventForEvent = async (
    event: Event,
    data?: Partial<Parameters<typeof ProgramItemFactory.create>[0]>,
  ): Promise<ProgramItem> => {
    return ProgramItemFactory.create({
      event: { connect: { id: event.id } },
      ...data,
    });
  };

  describe('GET /api/v1/events/:eventId/program-items', () => {
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
        await createEventForEvent(event);

        const response = await request()
          .get(`/api/v1/events/${event.id}/program-items`)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('title');
        expect(response.body.data[0]).toHaveProperty('date');
        expect(response.body.data[0]).toHaveProperty('time');
        expect(response.body.data[0]).toHaveProperty('duration');
        expect(response.body.data[0]).toHaveProperty('color');
        expect(response.body.data[0]).toHaveProperty('plan');
      },
    );

    it('should only return events belonging to the requested event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const otherEvent = await EventFactory.create();

      await createEventForEvent(event);
      await createEventForEvent(event);
      await createEventForEvent(otherEvent);

      const response = await request()
        .get(`/api/v1/events/${event.id}/program-items`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
    });

    it('should return `200` with empty array when event has no events', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      const response = await request()
        .get(`/api/v1/events/${event.id}/program-items`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });

    it('should respond with `403` when user is not a event manager', async () => {
      const event = await EventFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/events/${event.id}/program-items`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const event = await EventFactory.create();

      await request()
        .get(`/api/v1/events/${event.id}/program-items`)
        .expect(401);
    });
  });

  describe('GET /api/v1/events/:eventId/program-items/:programItemId', () => {
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
        const event = await createEventForEvent(event);

        const response = await request()
          .get(`/api/v1/events/${event.id}/program-items/${event.id}`)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        expect(response.body).toHaveProperty('data.id', event.id);
        expect(response.body).toHaveProperty('data.title');
        expect(response.body).toHaveProperty('data.plan');
      },
    );

    it('should respond with `404` when the event does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .get(`/api/v1/events/${event.id}/program-items/${ulid()}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `404` when the event belongs to a different event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const otherEvent = await EventFactory.create();
      const event = await createEventForEvent(otherEvent);

      await request()
        .get(`/api/v1/events/${event.id}/program-items/${event.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `403` when user is not a event manager', async () => {
      const event = await EventFactory.create();
      const event = await createEventForEvent(event);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/events/${event.id}/program-items/${event.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const event = await EventFactory.create();
      const event = await createEventForEvent(event);

      await request()
        .get(`/api/v1/events/${event.id}/program-items/${event.id}`)
        .expect(401);
    });
  });

  describe('POST /api/v1/events/:eventId/program-items', () => {
    const validPayload = {
      title: 'Morning Assembly',
      date: '2025-07-15',
      time: '08:00',
      duration: 60,
      color: '#FF0000',
      plan: 'both',
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
          .post(`/api/v1/events/${event.id}/program-items`)
          .send(validPayload)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        const count = await prisma.programItem.count();
        if (expectedStatus === 201) {
          expect(count).toBe(1);
        } else {
          expect(count).toBe(0);
        }
      },
    );

    it('should create an event with a string title', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/program-items`)
        .send(validPayload)
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.id');
      expect(body).toHaveProperty('data.title', validPayload.title);
      expect(body).toHaveProperty('data.date', validPayload.date);
      expect(body).toHaveProperty('data.time', validPayload.time);
      expect(body).toHaveProperty('data.duration', validPayload.duration);
      expect(body).toHaveProperty('data.color', validPayload.color);
      expect(body).toHaveProperty('data.plan', validPayload.plan);
    });

    it('should create an event with a translated title', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      const data = {
        title: { de: 'Morgenversammlung', en: 'Morning Assembly' },
      };

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/program-items`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.title.de', 'Morgenversammlung');
      expect(body).toHaveProperty('data.title.en', 'Morning Assembly');
    });

    it('should create an event with optional fields', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      const data = {
        title: 'Evening Activity',
        details: 'Eventfire and songs',
        location: 'Main Field',
        date: '2025-07-16',
        time: '20:00',
        duration: 90,
        color: '#0000FF',
        plan: 'a',
      };

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/program-items`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.details', data.details);
      expect(body).toHaveProperty('data.location', data.location);
      expect(body).toHaveProperty('data.plan', 'a');
    });

    it('should create an event with only a title', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .post(`/api/v1/events/${event.id}/program-items`)
        .send({ title: 'Minimal Event' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      const count = await prisma.programItem.count();
      expect(count).toBe(1);
    });

    it('should default plan to `both` when not provided', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/program-items`)
        .send({ title: 'Event without plan' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.plan', 'both');
    });

    it.each([
      { label: 'title is missing', data: {} },
      { label: 'time format is invalid', data: { title: 'T', time: '8:00' } },
      { label: 'duration is negative', data: { title: 'T', duration: -1 } },
      { label: 'plan is invalid', data: { title: 'T', plan: 'c' } },
    ])('should respond with `400` when $label', async ({ data }) => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .post(`/api/v1/events/${event.id}/program-items`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      const count = await prisma.programItem.count();
      expect(count).toBe(0);
    });

    it('should respond with `403` when user is not a event manager', async () => {
      const event = await EventFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .post(`/api/v1/events/${event.id}/program-items`)
        .send(validPayload)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const count = await prisma.programItem.count();
      expect(count).toBe(0);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const event = await EventFactory.create();

      await request()
        .post(`/api/v1/events/${event.id}/program-items`)
        .send(validPayload)
        .expect(401);

      const count = await prisma.programItem.count();
      expect(count).toBe(0);
    });
  });

  describe('PATCH /api/v1/events/:eventId/program-items/:programItemId', () => {
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
        const event = await createEventForEvent(event);

        await request()
          .patch(`/api/v1/events/${event.id}/program-items/${event.id}`)
          .send({ title: 'Updated Title' })
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);
      },
    );

    it('should update all fields', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const event = await createEventForEvent(event);

      const update = {
        title: 'Updated Title',
        details: 'New details',
        location: 'Sports Hall',
        date: '2025-08-01',
        time: '14:00',
        duration: 45,
        color: '#00FF00',
        plan: 'b',
      };

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/program-items/${event.id}`)
        .send(update)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.id', event.id);
      expect(body).toHaveProperty('data.title', update.title);
      expect(body).toHaveProperty('data.details', update.details);
      expect(body).toHaveProperty('data.location', update.location);
      expect(body).toHaveProperty('data.date', update.date);
      expect(body).toHaveProperty('data.time', update.time);
      expect(body).toHaveProperty('data.duration', update.duration);
      expect(body).toHaveProperty('data.color', update.color);
      expect(body).toHaveProperty('data.plan', update.plan);
    });

    it('should update only the provided fields', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const event = await createEventForEvent(event, {
        title: 'Original Title',
        plan: 'a',
      });

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/program-items/${event.id}`)
        .send({ plan: 'b' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.plan', 'b');
    });

    it('should update title with translated object', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const event = await createEventForEvent(event);

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/program-items/${event.id}`)
        .send({ title: { de: 'Deutsch', en: 'English' } })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.title.de', 'Deutsch');
      expect(body).toHaveProperty('data.title.en', 'English');
    });

    it('should clear nullable fields when set to null', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const event = await createEventForEvent(event, {
        time: '10:00',
        duration: 60,
        color: '#123456',
      });

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/program-items/${event.id}`)
        .send({ time: null, duration: null, color: null })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.time', null);
      expect(body).toHaveProperty('data.duration', null);
    });

    it('should respond with `404` when the event does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .patch(`/api/v1/events/${event.id}/program-items/${ulid()}`)
        .send({ title: 'Updated' })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `404` when the event belongs to a different event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const otherEvent = await EventFactory.create();
      const event = await createEventForEvent(otherEvent);

      await request()
        .patch(`/api/v1/events/${event.id}/program-items/${event.id}`)
        .send({ title: 'Updated' })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it.each([
      { label: 'time format is invalid', data: { time: '8:00' } },
      { label: 'duration is negative', data: { duration: -1 } },
      { label: 'plan is invalid', data: { plan: 'c' } },
    ])('should respond with `400` when $label', async ({ data }) => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const event = await createEventForEvent(event);

      await request()
        .patch(`/api/v1/events/${event.id}/program-items/${event.id}`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `403` when user is not a event manager', async () => {
      const event = await EventFactory.create();
      const event = await createEventForEvent(event);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .patch(`/api/v1/events/${event.id}/program-items/${event.id}`)
        .send({ title: 'Updated' })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const event = await EventFactory.create();
      const event = await createEventForEvent(event);

      await request()
        .patch(`/api/v1/events/${event.id}/program-items/${event.id}`)
        .send({ title: 'Updated' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/events/:eventId/program-items/:programItemId', () => {
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
        const event = await createEventForEvent(event);
        const otherEvent = await createEventForEvent(event);

        await request()
          .delete(`/api/v1/events/${event.id}/program-items/${event.id}`)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        const count = await prisma.programItem.count();
        if (expectedStatus === 204) {
          expect(count).toBe(1);
          const remaining = await prisma.programItem.findFirst();
          expect(remaining?.id).toBe(otherEvent.id);
        } else {
          expect(count).toBe(2);
        }
      },
    );

    it('should respond with `404` when the event does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .delete(`/api/v1/events/${event.id}/program-items/${ulid()}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `404` when the event belongs to a different event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const otherEvent = await EventFactory.create();
      const event = await createEventForEvent(otherEvent);

      await request()
        .delete(`/api/v1/events/${event.id}/program-items/${event.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);

      const count = await prisma.programItem.count();
      expect(count).toBe(1);
    });

    it('should respond with `403` when user is not a event manager', async () => {
      const event = await EventFactory.create();
      const event = await createEventForEvent(event);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .delete(`/api/v1/events/${event.id}/program-items/${event.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const count = await prisma.programItem.count();
      expect(count).toBe(1);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const event = await EventFactory.create();
      const event = await createEventForEvent(event);

      await request()
        .delete(`/api/v1/events/${event.id}/program-items/${event.id}`)
        .expect(401);

      const count = await prisma.programItem.count();
      expect(count).toBe(1);
    });
  });
});
