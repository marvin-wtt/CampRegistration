import { describe, expect, it } from 'vitest';
import {
  EventFactory,
  EventManagerFactory,
  EventSettingFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import { Event } from '#generated/prisma/client.js';

describe('/api/v1/events/:eventId/settings', () => {
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

  const createRoomPlannerSettingWithEvent = async (event: Event) => {
    return EventSettingFactory.create({
      event: { connect: { id: event.id } },
      key: SETTING_KEYS.ROOM_PLANNER,
      data: {
        skipGenderFilter: true,
        skipRoleFilter: false,
        sortBy: 'age',
      },
    });
  };

  describe('GET /api/v1/events/:eventId/settings/:key', () => {
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
        await createRoomPlannerSettingWithEvent(event);

        const response = await request()
          .get(
            `/api/v1/events/${event.id}/settings/${SETTING_KEYS.ROOM_PLANNER}`,
          )
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 200) {
          expect(response.body).toHaveProperty('data');
          expect(response.body.data).toHaveProperty(
            'key',
            SETTING_KEYS.ROOM_PLANNER,
          );
          expect(response.body.data.data).toEqual({
            skipGenderFilter: true,
            skipRoleFilter: false,
            sortBy: 'age',
          });
        }
      },
    );

    it('should respond with `404` status code when no value has been stored for the key yet', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .get(`/api/v1/events/${event.id}/settings/${SETTING_KEYS.ROOM_PLANNER}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `404` status code when the key is not registered by any module', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .get(`/api/v1/events/${event.id}/settings/does-not-exist`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `403` status code when user is not event manager', async () => {
      const event = await EventFactory.create();
      await createRoomPlannerSettingWithEvent(event);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/events/${event.id}/settings/${SETTING_KEYS.ROOM_PLANNER}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const event = await EventFactory.create();
      await createRoomPlannerSettingWithEvent(event);

      await request()
        .get(`/api/v1/events/${event.id}/settings/${SETTING_KEYS.ROOM_PLANNER}`)
        .send()
        .expect(401);
    });
  });

  describe('PUT /api/v1/events/:eventId/settings/:key', () => {
    const validData = {
      data: {
        skipGenderFilter: true,
        skipRoleFilter: true,
        sortBy: 'name',
      },
    };

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

        const response = await request()
          .put(
            `/api/v1/events/${event.id}/settings/${SETTING_KEYS.ROOM_PLANNER}`,
          )
          .send(validData)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        const settingCount = await prisma.eventSetting.count();

        if (expectedStatus === 200) {
          expect(response.body.data).toHaveProperty(
            'key',
            SETTING_KEYS.ROOM_PLANNER,
          );
          expect(response.body.data.data).toEqual(validData.data);
          expect(settingCount).toBe(1);
        } else {
          expect(settingCount).toBe(0);
        }
      },
    );

    it('creates the setting when none exists yet (upsert)', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .put(`/api/v1/events/${event.id}/settings/${SETTING_KEYS.ROOM_PLANNER}`)
        .send(validData)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const setting = await prisma.eventSetting.findFirst({
        where: { eventId: event.id, key: SETTING_KEYS.ROOM_PLANNER },
      });
      expect(setting).toBeDefined();
      expect(setting?.data).toEqual(validData.data);
    });

    it('updates the existing setting in place (upsert)', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      await createRoomPlannerSettingWithEvent(event);

      await request()
        .put(`/api/v1/events/${event.id}/settings/${SETTING_KEYS.ROOM_PLANNER}`)
        .send(validData)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const settingCount = await prisma.eventSetting.count();
      expect(settingCount).toBe(1);

      const setting = await prisma.eventSetting.findFirst({
        where: { eventId: event.id, key: SETTING_KEYS.ROOM_PLANNER },
      });
      expect(setting?.data).toEqual(validData.data);
    });

    it('should respond with `400` status code when the body does not match the key`s schema', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .put(`/api/v1/events/${event.id}/settings/${SETTING_KEYS.ROOM_PLANNER}`)
        .send({ data: { skipGenderFilter: 'not-a-boolean' } })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      const settingCount = await prisma.eventSetting.count();
      expect(settingCount).toBe(0);
    });

    it('should respond with `404` status code when the key is not registered by any module', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .put(`/api/v1/events/${event.id}/settings/does-not-exist`)
        .send(validData)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `403` status code when user is not event manager', async () => {
      const event = await EventFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .put(`/api/v1/events/${event.id}/settings/${SETTING_KEYS.ROOM_PLANNER}`)
        .send(validData)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const settingCount = await prisma.eventSetting.count();
      expect(settingCount).toBe(0);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const event = await EventFactory.create();

      await request()
        .put(`/api/v1/events/${event.id}/settings/${SETTING_KEYS.ROOM_PLANNER}`)
        .send(validData)
        .expect(401);

      const settingCount = await prisma.eventSetting.count();
      expect(settingCount).toBe(0);
    });
  });
});
