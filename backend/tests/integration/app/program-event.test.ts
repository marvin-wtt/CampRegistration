import { describe, expect, it } from 'vitest';
import {
  CampFactory,
  CampManagerFactory,
  ProgramEventFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { generateAccessToken } from './utils/token.js';
import { Camp, ProgramEvent } from '#generated/prisma/client.js';
import { ulid } from 'ulidx';

describe('/api/v1/camps/:campId/program-events', () => {
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

  const createEventForCamp = async (
    camp: Camp,
    data?: Partial<Parameters<typeof ProgramEventFactory.create>[0]>,
  ): Promise<ProgramEvent> => {
    return ProgramEventFactory.create({
      camp: { connect: { id: camp.id } },
      ...data,
    });
  };

  describe('GET /api/v1/camps/:campId/program-events', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 200 },
    ])(
      'should respond with `$expectedStatus` when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);
        await createEventForCamp(camp);

        const response = await request()
          .get(`/api/v1/camps/${camp.id}/program-events`)
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

    it('should only return events belonging to the requested camp', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const otherCamp = await CampFactory.create();

      await createEventForCamp(camp);
      await createEventForCamp(camp);
      await createEventForCamp(otherCamp);

      const response = await request()
        .get(`/api/v1/camps/${camp.id}/program-events`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
    });

    it('should return `200` with empty array when camp has no events', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      const response = await request()
        .get(`/api/v1/camps/${camp.id}/program-events`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });

    it('should respond with `403` when user is not a camp manager', async () => {
      const camp = await CampFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/camps/${camp.id}/program-events`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const camp = await CampFactory.create();

      await request()
        .get(`/api/v1/camps/${camp.id}/program-events`)
        .expect(401);
    });
  });

  describe('GET /api/v1/camps/:campId/program-events/:programEventId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 200 },
    ])(
      'should respond with `$expectedStatus` when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);
        const event = await createEventForCamp(camp);

        const response = await request()
          .get(`/api/v1/camps/${camp.id}/program-events/${event.id}`)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        expect(response.body).toHaveProperty('data.id', event.id);
        expect(response.body).toHaveProperty('data.title');
        expect(response.body).toHaveProperty('data.plan');
      },
    );

    it('should respond with `404` when the event does not exist', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      await request()
        .get(`/api/v1/camps/${camp.id}/program-events/${ulid()}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `404` when the event belongs to a different camp', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const otherCamp = await CampFactory.create();
      const event = await createEventForCamp(otherCamp);

      await request()
        .get(`/api/v1/camps/${camp.id}/program-events/${event.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `403` when user is not a camp manager', async () => {
      const camp = await CampFactory.create();
      const event = await createEventForCamp(camp);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/camps/${camp.id}/program-events/${event.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const event = await createEventForCamp(camp);

      await request()
        .get(`/api/v1/camps/${camp.id}/program-events/${event.id}`)
        .expect(401);
    });
  });

  describe('POST /api/v1/camps/:campId/program-events', () => {
    const validPayload = {
      title: 'Morning Assembly',
      date: '2025-07-15',
      time: '08:00',
      duration: 60,
      color: 'blue',
      plan: 'both',
    };

    it.each([
      { role: 'DIRECTOR', expectedStatus: 201 },
      { role: 'COORDINATOR', expectedStatus: 201 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);

        await request()
          .post(`/api/v1/camps/${camp.id}/program-events`)
          .send(validPayload)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        const count = await prisma.programEvent.count();
        if (expectedStatus === 201) {
          expect(count).toBe(1);
        } else {
          expect(count).toBe(0);
        }
      },
    );

    it('should create an event with a string title', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/program-events`)
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
      const { camp, accessToken } = await createCampWithManagerAndToken();

      const data = {
        title: { de: 'Morgenversammlung', en: 'Morning Assembly' },
      };

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/program-events`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.title.de', 'Morgenversammlung');
      expect(body).toHaveProperty('data.title.en', 'Morning Assembly');
    });

    it('should create an event with optional fields', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      const data = {
        title: 'Evening Activity',
        details: 'Campfire and songs',
        location: 'Main Field',
        date: '2025-07-16',
        time: '20:00',
        duration: 90,
        color: 'orange',
        plan: 'a',
      };

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/program-events`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.details', data.details);
      expect(body).toHaveProperty('data.location', data.location);
      expect(body).toHaveProperty('data.plan', 'a');
    });

    it('should create an event with only a title', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      await request()
        .post(`/api/v1/camps/${camp.id}/program-events`)
        .send({ title: 'Minimal Event' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      const count = await prisma.programEvent.count();
      expect(count).toBe(1);
    });

    it('should default plan to `both` when not provided', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/program-events`)
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
      const { camp, accessToken } = await createCampWithManagerAndToken();

      await request()
        .post(`/api/v1/camps/${camp.id}/program-events`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      const count = await prisma.programEvent.count();
      expect(count).toBe(0);
    });

    it('should respond with `403` when user is not a camp manager', async () => {
      const camp = await CampFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .post(`/api/v1/camps/${camp.id}/program-events`)
        .send(validPayload)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const count = await prisma.programEvent.count();
      expect(count).toBe(0);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const camp = await CampFactory.create();

      await request()
        .post(`/api/v1/camps/${camp.id}/program-events`)
        .send(validPayload)
        .expect(401);

      const count = await prisma.programEvent.count();
      expect(count).toBe(0);
    });
  });

  describe('PATCH /api/v1/camps/:campId/program-events/:programEventId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);
        const event = await createEventForCamp(camp);

        await request()
          .patch(`/api/v1/camps/${camp.id}/program-events/${event.id}`)
          .send({ title: 'Updated Title' })
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);
      },
    );

    it('should update all fields', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const event = await createEventForCamp(camp);

      const update = {
        title: 'Updated Title',
        details: 'New details',
        location: 'Sports Hall',
        date: '2025-08-01',
        time: '14:00',
        duration: 45,
        color: 'green',
        plan: 'b',
      };

      const { body } = await request()
        .patch(`/api/v1/camps/${camp.id}/program-events/${event.id}`)
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
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const event = await createEventForCamp(camp, {
        title: 'Original Title',
        plan: 'a',
      });

      const { body } = await request()
        .patch(`/api/v1/camps/${camp.id}/program-events/${event.id}`)
        .send({ plan: 'b' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.plan', 'b');
    });

    it('should update title with translated object', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const event = await createEventForCamp(camp);

      const { body } = await request()
        .patch(`/api/v1/camps/${camp.id}/program-events/${event.id}`)
        .send({ title: { de: 'Deutsch', en: 'English' } })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.title.de', 'Deutsch');
      expect(body).toHaveProperty('data.title.en', 'English');
    });

    it('should clear nullable fields when set to null', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const event = await createEventForCamp(camp, {
        time: '10:00',
        duration: 60,
        color: 'red',
      });

      const { body } = await request()
        .patch(`/api/v1/camps/${camp.id}/program-events/${event.id}`)
        .send({ time: null, duration: null, color: null })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.time', null);
      expect(body).toHaveProperty('data.duration', null);
    });

    it('should respond with `404` when the event does not exist', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      await request()
        .patch(`/api/v1/camps/${camp.id}/program-events/${ulid()}`)
        .send({ title: 'Updated' })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `404` when the event belongs to a different camp', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const otherCamp = await CampFactory.create();
      const event = await createEventForCamp(otherCamp);

      await request()
        .patch(`/api/v1/camps/${camp.id}/program-events/${event.id}`)
        .send({ title: 'Updated' })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it.each([
      { label: 'time format is invalid', data: { time: '8:00' } },
      { label: 'duration is negative', data: { duration: -1 } },
      { label: 'plan is invalid', data: { plan: 'c' } },
    ])('should respond with `400` when $label', async ({ data }) => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const event = await createEventForCamp(camp);

      await request()
        .patch(`/api/v1/camps/${camp.id}/program-events/${event.id}`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `403` when user is not a camp manager', async () => {
      const camp = await CampFactory.create();
      const event = await createEventForCamp(camp);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .patch(`/api/v1/camps/${camp.id}/program-events/${event.id}`)
        .send({ title: 'Updated' })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const event = await createEventForCamp(camp);

      await request()
        .patch(`/api/v1/camps/${camp.id}/program-events/${event.id}`)
        .send({ title: 'Updated' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/camps/:campId/program-events/:programEventId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 204 },
      { role: 'COORDINATOR', expectedStatus: 204 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);
        const event = await createEventForCamp(camp);
        const otherEvent = await createEventForCamp(camp);

        await request()
          .delete(`/api/v1/camps/${camp.id}/program-events/${event.id}`)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        const count = await prisma.programEvent.count();
        if (expectedStatus === 204) {
          expect(count).toBe(1);
          const remaining = await prisma.programEvent.findFirst();
          expect(remaining?.id).toBe(otherEvent.id);
        } else {
          expect(count).toBe(2);
        }
      },
    );

    it('should respond with `404` when the event does not exist', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      await request()
        .delete(`/api/v1/camps/${camp.id}/program-events/${ulid()}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `404` when the event belongs to a different camp', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const otherCamp = await CampFactory.create();
      const event = await createEventForCamp(otherCamp);

      await request()
        .delete(`/api/v1/camps/${camp.id}/program-events/${event.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);

      const count = await prisma.programEvent.count();
      expect(count).toBe(1);
    });

    it('should respond with `403` when user is not a camp manager', async () => {
      const camp = await CampFactory.create();
      const event = await createEventForCamp(camp);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .delete(`/api/v1/camps/${camp.id}/program-events/${event.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const count = await prisma.programEvent.count();
      expect(count).toBe(1);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const event = await createEventForCamp(camp);

      await request()
        .delete(`/api/v1/camps/${camp.id}/program-events/${event.id}`)
        .expect(401);

      const count = await prisma.programEvent.count();
      expect(count).toBe(1);
    });
  });
});
