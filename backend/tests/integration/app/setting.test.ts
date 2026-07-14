import { describe, expect, it } from 'vitest';
import {
  CampFactory,
  CampManagerFactory,
  CampSettingFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import { Camp } from '#generated/prisma/client.js';

describe('/api/v1/camps/:campId/settings', () => {
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

  const createRoomPlannerSettingWithCamp = async (camp: Camp) => {
    return CampSettingFactory.create({
      camp: { connect: { id: camp.id } },
      key: SETTING_KEYS.ROOM_PLANNER,
      data: {
        skipGenderFilter: true,
        skipRoleFilter: false,
      },
    });
  };

  describe('GET /api/v1/camps/:campId/settings/:key', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 200 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);
        await createRoomPlannerSettingWithCamp(camp);

        const response = await request()
          .get(`/api/v1/camps/${camp.id}/settings/${SETTING_KEYS.ROOM_PLANNER}`)
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
          });
        }
      },
    );

    it('should respond with `404` status code when no value has been stored for the key yet', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      await request()
        .get(`/api/v1/camps/${camp.id}/settings/${SETTING_KEYS.ROOM_PLANNER}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `404` status code when the key is not registered by any module', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      await request()
        .get(`/api/v1/camps/${camp.id}/settings/does-not-exist`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      await createRoomPlannerSettingWithCamp(camp);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/camps/${camp.id}/settings/${SETTING_KEYS.ROOM_PLANNER}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      await createRoomPlannerSettingWithCamp(camp);

      await request()
        .get(`/api/v1/camps/${camp.id}/settings/${SETTING_KEYS.ROOM_PLANNER}`)
        .send()
        .expect(401);
    });
  });

  describe('PUT /api/v1/camps/:campId/settings/:key', () => {
    const validData = {
      data: {
        skipGenderFilter: true,
        skipRoleFilter: true,
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
        const { camp, accessToken } = await createCampWithManagerAndToken(role);

        const response = await request()
          .put(`/api/v1/camps/${camp.id}/settings/${SETTING_KEYS.ROOM_PLANNER}`)
          .send(validData)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        const settingCount = await prisma.campSetting.count();

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
      const { camp, accessToken } = await createCampWithManagerAndToken();

      await request()
        .put(`/api/v1/camps/${camp.id}/settings/${SETTING_KEYS.ROOM_PLANNER}`)
        .send(validData)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const setting = await prisma.campSetting.findFirst({
        where: { campId: camp.id, key: SETTING_KEYS.ROOM_PLANNER },
      });
      expect(setting).toBeDefined();
      expect(setting?.data).toEqual(validData.data);
    });

    it('updates the existing setting in place (upsert)', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      await createRoomPlannerSettingWithCamp(camp);

      await request()
        .put(`/api/v1/camps/${camp.id}/settings/${SETTING_KEYS.ROOM_PLANNER}`)
        .send(validData)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const settingCount = await prisma.campSetting.count();
      expect(settingCount).toBe(1);

      const setting = await prisma.campSetting.findFirst({
        where: { campId: camp.id, key: SETTING_KEYS.ROOM_PLANNER },
      });
      expect(setting?.data).toEqual(validData.data);
    });

    it('should respond with `400` status code when the body does not match the key`s schema', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      await request()
        .put(`/api/v1/camps/${camp.id}/settings/${SETTING_KEYS.ROOM_PLANNER}`)
        .send({ data: { skipGenderFilter: 'not-a-boolean' } })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      const settingCount = await prisma.campSetting.count();
      expect(settingCount).toBe(0);
    });

    it('should respond with `404` status code when the key is not registered by any module', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      await request()
        .put(`/api/v1/camps/${camp.id}/settings/does-not-exist`)
        .send(validData)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .put(`/api/v1/camps/${camp.id}/settings/${SETTING_KEYS.ROOM_PLANNER}`)
        .send(validData)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const settingCount = await prisma.campSetting.count();
      expect(settingCount).toBe(0);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();

      await request()
        .put(`/api/v1/camps/${camp.id}/settings/${SETTING_KEYS.ROOM_PLANNER}`)
        .send(validData)
        .expect(401);

      const settingCount = await prisma.campSetting.count();
      expect(settingCount).toBe(0);
    });
  });
});
