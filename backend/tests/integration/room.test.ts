import { describe, expect, it } from 'vitest';
import {
  CampFactory,
  CampManagerFactory,
  RoomFactory,
  UserFactory,
} from '../../prisma/factories';
import { request } from '../utils/request';
import prisma from '../utils/prisma';
import { generateAccessToken } from '../utils/token';
import { Camp } from '@prisma/client';
import { ulid } from 'ulidx';

describe('/api/v1/camps/:campId/rooms/', () => {
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

  const createRoomWithCamp = async (camp: Camp) => {
    return await RoomFactory.create({
      camp: { connect: { id: camp.id } },
    });
  };

  describe('GET /api/v1/camps/:campId/rooms/', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 200 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);
        await createRoomWithCamp(camp);

        const response = await request()
          .get(`/api/v1/camps/${camp.id}/rooms`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 200) {
          expect(response.body).toHaveProperty('data');
          expect(response.body.data).toHaveLength(1);
          expect(response.body.data[0]).toHaveProperty('id');
          expect(response.body.data[0]).toHaveProperty('name');
          expect(response.body.data[0]).toHaveProperty('beds');
        }
      },
    );

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/camps/${camp.id}/rooms`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();

      await request().get(`/api/v1/camps/${camp.id}/rooms`).send().expect(401);
    });
  });

  describe('GET /api/v1/camps/:campId/rooms/:roomId', () => {
    it('should respond with `200` status code when user is camp manager', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const room = await createRoomWithCamp(camp);

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/rooms/${room.id}/`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data');
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());
      const room = await createRoomWithCamp(camp);

      await request()
        .get(`/api/v1/camps/${camp.id}/rooms/${room.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const room = await createRoomWithCamp(camp);

      await request()
        .get(`/api/v1/camps/${camp.id}/rooms/${room.id}`)
        .send()
        .expect(401);
    });

    it('should respond with `404` status code when camp id does not exists', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const roomId = ulid();

      await request()
        .get(`/api/v1/camps/${camp.id}/rooms/${roomId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('POST /api/v1/camps/:campId/rooms/', () => {
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
          name: 'Room 1',
        };

        await request()
          .post(`/api/v1/camps/${camp.id}/rooms/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 201) {
          const roomCount = await prisma.room.count();
          expect(roomCount).toBeGreaterThan(0);
        } else {
          const roomCount = await prisma.room.count();
          expect(roomCount).toBe(0);
        }
      },
    );

    it('should respond with `201` status code when provided with capacity', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      const data = {
        name: 'Room 1',
        capacity: 5,
      };

      await request()
        .post(`/api/v1/camps/${camp.id}/rooms/`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      const roomCount = await prisma.room.count();
      expect(roomCount).toBe(1);

      const bedCount = await prisma.bed.count();
      expect(bedCount).toBe(5);
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      const data = {
        name: 'Room 1',
        capacity: 5,
      };

      await request()
        .post(`/api/v1/camps/${camp.id}/rooms/`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const count = await prisma.room.count();
      expect(count).toBe(0);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();

      const data = {
        name: 'Room 1',
        capacity: 5,
      };

      await request()
        .post(`/api/v1/camps/${camp.id}/rooms/`)
        .send(data)
        .expect(401);

      const count = await prisma.room.count();
      expect(count).toBe(0);
    });
  });

  describe('PATCH /api/v1/camps/:campId/rooms/:roomId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);
        const room = await createRoomWithCamp(camp);

        const data = {
          name: 'Updated Room',
        };

        const response = await request()
          .patch(`/api/v1/camps/${camp.id}/rooms/${room.id}`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 200) {
          expect(response.body).toHaveProperty('data.name', 'Updated Room');

          const updatedRoom = await prisma.room.findFirst();
          expect(updatedRoom).toBeDefined();
          expect(updatedRoom).toHaveProperty('name', 'Updated Room');
        }
      },
    );

    it('should respond with `200` status code when name is translated', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const room = await createRoomWithCamp(camp);

      const data = {
        name: {
          de: 'German name',
          em: 'English name',
        },
      };

      await request()
        .patch(`/api/v1/camps/${camp.id}/rooms/${room.id}`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const room = await createRoomWithCamp(camp);
      const accessToken = generateAccessToken(await UserFactory.create());

      const data = {
        name: 'Updated Room',
      };

      await request()
        .patch(`/api/v1/camps/${camp.id}/rooms/${room.id}`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const room = await createRoomWithCamp(camp);

      await request()
        .delete(`/api/v1/camps/${camp.id}/rooms/${room.id}`)
        .send()
        .expect(401);

      const count = await prisma.room.count();
      expect(count).toBe(1);
    });
  });

  describe('DELETE /api/v1/camps/:campId/rooms/:roomId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 204 },
      { role: 'COORDINATOR', expectedStatus: 204 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);
        const room = await createRoomWithCamp(camp);
        const otherRoom = await createRoomWithCamp(camp);

        await request()
          .delete(`/api/v1/camps/${camp.id}/rooms/${room.id}`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 204) {
          const count = await prisma.room.count();
          expect(count).toBe(1);

          const remainingRoom = await prisma.room.findFirst();
          expect(remainingRoom?.id).toBe(otherRoom.id);
        } else {
          const count = await prisma.room.count();
          expect(count).toBe(2);
        }
      },
    );

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const room = await createRoomWithCamp(camp);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .delete(`/api/v1/camps/${camp.id}/rooms/${room.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const count = await prisma.room.count();
      expect(count).toBe(1);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const room = await createRoomWithCamp(camp);

      await request()
        .delete(`/api/v1/camps/${camp.id}/rooms/${room.id}`)
        .send()
        .expect(401);

      const count = await prisma.room.count();
      expect(count).toBe(1);
    });
  });
});
