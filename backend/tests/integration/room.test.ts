import { beforeEach, describe, expect, it } from 'vitest';
import { CampFactory, RoomFactory, UserFactory } from '../../prisma/factories';
import { request } from '../utils/request';
import prisma from '../utils/prisma';
import { generateAccessToken } from '../utils/token';

describe.skip('/api/v1/camps/:campId/rooms/', () => {
  describe('GET /api/v1/camps/:campId/rooms/', () => {});

  describe('GET /api/v1/camps/:campId/rooms/:roomId', () => {});

  describe('POST /api/v1/camps/:campId/rooms/', () => {
    it('should respond with `201` status code when user is camp manager', async () => {
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
        .expect(204);

      const roomCount = await prisma.room.count();
      expect(roomCount).toBe(1);

      const bedCount = await prisma.bed.count();
      expect(bedCount).toBe(1);
    });
  });

  describe('PATCH /api/v1/camps/:campId/rooms/:roomId', () => {});

  describe('DELETE /api/v1/camps/:campId/rooms/:roomId', () => {
    it('should respond with `204` status code when user is camp manager', async () => {
      const camp = await CampFactory.create();
      const room = await RoomFactory.create({
        camp: { connect: { id: camp.id } },
      });
      const accessToken = generateAccessToken(await UserFactory.create());
      const otherRoom = await RoomFactory.create({
        camp: { connect: { id: camp.id } },
      });

      await request()
        .delete(`/api/v1/camps/${camp.id}/rooms/${room.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      const count = await prisma.room.count();
      expect(count).toBe(1);

      const remainingRoom = await prisma.room.findFirst();
      expect(remainingRoom?.id).toBe(otherRoom.id);
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const room = await RoomFactory.create({
        camp: { connect: { id: camp.id } },
      });
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .delete(`/api/v1/camps/${camp.id}/rooms/${room.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const count = await prisma.camp.count();
      expect(count).toBe(1);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const room = await RoomFactory.create({
        camp: { connect: { id: camp.id } },
      });

      await request()
        .delete(`/api/v1/camps/${camp.id}/rooms/${room.id}`)
        .send()
        .expect(401);

      const count = await prisma.room.count();
      expect(count).toBe(1);
    });
  });
});
