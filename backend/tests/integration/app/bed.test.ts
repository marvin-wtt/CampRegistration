import { describe, expect, it } from 'vitest';
import {
  BedFactory,
  CampFactory,
  CampManagerFactory,
  RegistrationFactory,
  RoomFactory,
  UserFactory,
} from '../../../prisma/factories';
import { generateAccessToken } from '../../utils/token';
import { Camp, Room } from '@prisma/client';
import { request } from '../../utils/request';
import prisma from '../../utils/prisma';
import { ulid } from 'ulidx';

describe('/api/v1/camps/:campId/rooms/:roomId/beds', () => {
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
    it.each([
      { role: 'DIRECTOR', expectedStatus: 201 },
      { role: 'COORDINATOR', expectedStatus: 201 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);
        const room = await createRoomWithCamp(camp);

        const response = await request()
          .post(`/api/v1/camps/${camp.id}/rooms/${room.id}/beds`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 201) {
          expect(response.body).toHaveProperty('data.id');
          expect(response.body).toHaveProperty('data.registrationId', null);

          const bedCount = await prisma.bed.count();
          expect(bedCount).toBeGreaterThan(0);
        }
      },
    );

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
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);
        const room = await createRoomWithCamp(camp);
        const bed = await createBedWithRoom(room);
        const registration = await createRegistration(camp);

        const data = {
          registrationId: registration.id,
        };

        const response = await request()
          .patch(`/api/v1/camps/${camp.id}/rooms/${room.id}/beds/${bed.id}`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 200) {
          expect(response.body).toHaveProperty(
            'data.registrationId',
            registration.id,
          );

          const updatedBed = await prisma.bed.findFirst();
          expect(updatedBed).toBeDefined();
          expect(updatedBed).toHaveProperty('registrationId', registration.id);
        }
      },
    );

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
        const bed = await createBedWithRoom(room);
        const otherBed = await createBedWithRoom(room);

        await request()
          .delete(`/api/v1/camps/${camp.id}/rooms/${room.id}/beds/${bed.id}`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 204) {
          const count = await prisma.bed.count();
          expect(count).toBe(1);

          const remainingBed = await prisma.bed.findFirst();
          expect(remainingBed?.id).toBe(otherBed.id);
        } else {
          const count = await prisma.bed.count();
          expect(count).toBe(2);
        }
      },
    );

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
