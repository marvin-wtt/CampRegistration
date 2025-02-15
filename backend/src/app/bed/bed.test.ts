import { describe, expect, it } from 'vitest';
import {
  BedFactory,
  CampFactory,
  CampManagerFactory,
  RegistrationFactory,
  RoomFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from '../../../tests/utils/token.js';
import { Camp, Room } from '@prisma/client';
import { request } from '../../../tests/utils/request.js';
import prisma from '../../../tests/utils/prisma.js';
import { ulid } from 'ulidx';

describe('/api/v1/camps/:campId/rooms/:roomId/beds', () => {
  const createCampWithManagerAndToken = async () => {
    const camp = await CampFactory.create();
    const user = await UserFactory.create();
    const manager = await CampManagerFactory.create({
      camp: { connect: { id: camp.id } },
      user: { connect: { id: user.id } },
    });
    const accessToken = generateAccessToken(user);

    return {
      camp,
      user,
      manager,
      accessToken,
    };
  };

  const createRegistration = async (camp: Camp) => {
    return RegistrationFactory.create({
      camp: { connect: { id: camp.id } },
    });
  };

  const createRoomWithCamp = async (camp: Camp) => {
    return await RoomFactory.create({
      camp: { connect: { id: camp.id } },
    });
  };

  const createBedWithRoom = async (room: Room) => {
    return await BedFactory.create({
      room: { connect: { id: room.id } },
    });
  };

  describe('POST /api/v1/camps/:campId/rooms/:roomId/beds', () => {
    it('should respond with `201` status code when user is camp manager', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const room = await createRoomWithCamp(camp);

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/rooms/${room.id}/beds`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.id');
      expect(body).toHaveProperty('data.registrationId', null);

      const bedCount = await prisma.bed.count();
      expect(bedCount).toBe(1);
    });

    it('should respond with `201` status code when provided with registration id', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const room = await createRoomWithCamp(camp);
      const registration = await createRegistration(camp);

      const data = {
        registrationId: registration.id,
      };

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/rooms/${room.id}/beds`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.id');
      expect(body).toHaveProperty('data.registrationId', registration.id);

      const bedCount = await prisma.bed.count();
      expect(bedCount).toBe(1);
    });

    it('should respond with `100` status code when provided with invalid registration id', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const room = await createRoomWithCamp(camp);

      const data = {
        registrationId: ulid(),
      };

      await request()
        .post(`/api/v1/camps/${camp.id}/rooms/${room.id}/beds`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const room = await createRoomWithCamp(camp);
      const accessToken = generateAccessToken(await UserFactory.create());

      const data = {
        name: 'Room 1',
        capacity: 5,
      };

      await request()
        .post(`/api/v1/camps/${camp.id}/rooms/${room.id}/beds`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const count = await prisma.bed.count();
      expect(count).toBe(0);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const room = await createRoomWithCamp(camp);

      const data = {
        name: 'Room 1',
        capacity: 5,
      };

      await request()
        .post(`/api/v1/camps/${camp.id}/rooms/${room.id}/beds`)
        .send(data)
        .expect(401);

      const count = await prisma.bed.count();
      expect(count).toBe(0);
    });
  });

  describe('PATCH /api/v1/camps/:campId/rooms/:roomId/beds/:bedId', () => {
    it('should respond with `200` status code when user is a camp manager', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const room = await createRoomWithCamp(camp);
      const bed = await createBedWithRoom(room);
      const registration = await createRegistration(camp);

      const data = {
        registrationId: registration.id,
      };

      const { body } = await request()
        .patch(`/api/v1/camps/${camp.id}/rooms/${room.id}/beds/${bed.id}`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.registrationId', registration.id);

      const updatedBed = await prisma.bed.findFirst();
      expect(updatedBed).toBeDefined();
      expect(updatedBed).toHaveProperty('registrationId', registration.id);
    });

    it('should respond with `400` status code when registration id is invalid', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const room = await createRoomWithCamp(camp);
      const bed = await createBedWithRoom(room);

      const data = {
        registrationId: ulid(),
      };

      await request()
        .patch(`/api/v1/camps/${camp.id}/rooms/${room.id}/beds/${bed.id}`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const room = await createRoomWithCamp(camp);
      const bed = await createBedWithRoom(room);
      const accessToken = generateAccessToken(await UserFactory.create());

      const data = {
        name: 'Updated Room',
      };

      await request()
        .patch(`/api/v1/camps/${camp.id}/rooms/${room.id}/beds/${bed.id}`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const room = await createRoomWithCamp(camp);
      const bed = await createBedWithRoom(room);

      await request()
        .patch(`/api/v1/camps/${camp.id}/rooms/${room.id}/beds/${bed.id}`)
        .send()
        .expect(401);

      const count = await prisma.bed.count();
      expect(count).toBe(1);
    });
  });

  describe('DELETE /api/v1/camps/:campId/rooms/:roomId/beds/:bedId', () => {
    it('should respond with `204` status code when user is camp manager', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const room = await createRoomWithCamp(camp);
      const bed = await createBedWithRoom(room);
      const otherBed = await createBedWithRoom(room);

      await request()
        .delete(`/api/v1/camps/${camp.id}/rooms/${room.id}/beds/${bed.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      const count = await prisma.bed.count();
      expect(count).toBe(1);

      const remainingBed = await prisma.bed.findFirst();
      expect(remainingBed?.id).toBe(otherBed.id);
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const room = await createRoomWithCamp(camp);
      const bed = await createBedWithRoom(room);
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .delete(`/api/v1/camps/${camp.id}/rooms/${room.id}/beds/${bed.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const count = await prisma.bed.count();
      expect(count).toBe(1);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const room = await createRoomWithCamp(camp);
      const bed = await createBedWithRoom(room);

      await request()
        .delete(`/api/v1/camps/${camp.id}/rooms/${room.id}/beds/${bed.id}`)
        .send()
        .expect(401);

      const count = await prisma.bed.count();
      expect(count).toBe(1);
    });
  });
});
