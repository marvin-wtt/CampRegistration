import { describe, expect, it } from 'vitest';
import {
  DutyAssignmentFactory,
  DutyFactory,
  EventFactory,
  EventManagerFactory,
  RegistrationFactory,
  RoomFactory,
  BedFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { generateAccessToken } from './utils/token.js';
import { Event } from '#generated/prisma/client.js';
import { ulid } from 'ulidx';

describe('/api/v1/events/:eventId/duty-assignments', () => {
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

  const createDuty = async (
    event: Event,
    data?: Partial<Parameters<typeof DutyFactory.create>[0]>,
  ) => {
    return DutyFactory.create({
      event: { connect: { id: event.id } },
      ...data,
    });
  };

  const createRegistration = async (
    event: Event,
    data?: Partial<Parameters<typeof RegistrationFactory.create>[0]>,
  ) => {
    return RegistrationFactory.create({
      event: { connect: { id: event.id } },
      ...data,
    });
  };

  const createAssignment = async (
    event: Event,
    dutyId: string,
    data?: Partial<Parameters<typeof DutyAssignmentFactory.create>[0]>,
  ) => {
    return DutyAssignmentFactory.create({
      event: { connect: { id: event.id } },
      duty: { connect: { id: dutyId } },
      rotationUnit: 'PARTICIPANT',
      ...data,
    });
  };

  describe('GET /api/v1/events/:eventId/duty-assignments', () => {
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
        const duty = await createDuty(event);
        const registration = await createRegistration(event);
        await createAssignment(event, duty.id, {
          date: '2026-09-01',
          slot: 'Lunch',
          members: { create: [{ registrationId: registration.id }] },
        });

        const response = await request()
          .get(`/api/v1/events/${event.id}/duty-assignments`)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        expect(response.body.data).toHaveLength(1);
        const item = response.body.data[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('dutyId', duty.id);
        expect(item).toHaveProperty('duty.id', duty.id);
        expect(item).toHaveProperty('duty.name', duty.name);
        expect(item).toHaveProperty('rotationUnit', 'PARTICIPANT');
        expect(item).toHaveProperty('date', '2026-09-01');
        expect(item).toHaveProperty('slot', 'Lunch');
        expect(item.registrationIds).toEqual([registration.id]);
      },
    );

    it('should respond with `403` when user is not a event manager', async () => {
      const event = await EventFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/events/${event.id}/duty-assignments`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const event = await EventFactory.create();

      await request()
        .get(`/api/v1/events/${event.id}/duty-assignments`)
        .expect(401);
    });
  });

  describe('GET /api/v1/events/:eventId/duty-assignments/suggestions', () => {
    it('respects route ordering — "suggestions" is not treated as an id', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const duty = await createDuty(event);

      await request()
        .get(`/api/v1/events/${event.id}/duty-assignments/suggestions`)
        .query({ dutyId: duty.id, unit: 'PARTICIPANT' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
    });

    it('should respond with `404` when the duty does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .get(`/api/v1/events/${event.id}/duty-assignments/suggestions`)
        .query({ dutyId: ulid(), unit: 'PARTICIPANT' })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it.each([
      { label: 'dutyId is missing', query: { unit: 'PARTICIPANT' } },
      { label: 'unit is missing', query: {} },
      {
        label: 'unit is invalid',
        query: { unit: 'GROUP' },
        withDuty: true,
      },
    ])('should respond with `400` when $label', async ({ query, withDuty }) => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const dutyId = withDuty ? (await createDuty(event)).id : undefined;

      await request()
        .get(`/api/v1/events/${event.id}/duty-assignments/suggestions`)
        .query({ ...query, ...(dutyId ? { dutyId } : {}) })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('ranks PARTICIPANT candidates least-assigned-first, never-assigned before assigned', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const duty = await createDuty(event);
      const assignedTwice = await createRegistration(event);
      const assignedOnce = await createRegistration(event);
      const neverAssigned = await createRegistration(event);

      await createAssignment(event, duty.id, {
        date: '2026-08-01',
        members: {
          create: [
            { registrationId: assignedTwice.id },
            { registrationId: assignedOnce.id },
          ],
        },
      });
      await createAssignment(event, duty.id, {
        date: '2026-08-10',
        members: { create: [{ registrationId: assignedTwice.id }] },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/duty-assignments/suggestions`)
        .query({ dutyId: duty.id, unit: 'PARTICIPANT' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.unit).toBe('PARTICIPANT');
      const order = body.data.candidates.map(
        (c: { id: string }) => c.id,
      ) as string[];
      expect(order.indexOf(neverAssigned.id)).toBeLessThan(
        order.indexOf(assignedOnce.id),
      );
      expect(order.indexOf(assignedOnce.id)).toBeLessThan(
        order.indexOf(assignedTwice.id),
      );
    });

    it('excludes staff from PARTICIPANT candidates when excludeStaff is set', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const duty = await createDuty(event, { excludeStaff: true });
      const participant = await createRegistration(event, {
        role: 'participant',
      });
      const staff = await createRegistration(event, { role: 'counselor' });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/duty-assignments/suggestions`)
        .query({ dutyId: duty.id, unit: 'PARTICIPANT' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const ids = body.data.candidates.map((c: { id: string }) => c.id);
      expect(ids).toContain(participant.id);
      expect(ids).not.toContain(staff.id);
    });

    it('ranks ROOM candidates by the current room of historically assigned participants', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const duty = await createDuty(event);

      const usedRoom = await RoomFactory.create({
        event: { connect: { id: event.id } },
      });
      const unusedRoom = await RoomFactory.create({
        event: { connect: { id: event.id } },
      });
      const registration = await createRegistration(event);
      await BedFactory.create({
        room: { connect: { id: usedRoom.id } },
        registration: { connect: { id: registration.id } },
      });
      // Occupied but never assigned this duty — must still be a candidate,
      // as opposed to a genuinely empty room (see the "excludes empty rooms"
      // test below).
      await BedFactory.create({
        room: { connect: { id: unusedRoom.id } },
        registration: { connect: { id: (await createRegistration(event)).id } },
      });

      await createAssignment(event, duty.id, {
        rotationUnit: 'ROOM',
        date: '2026-08-01',
        members: { create: [{ registrationId: registration.id }] },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/duty-assignments/suggestions`)
        .query({ dutyId: duty.id, unit: 'ROOM' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.unit).toBe('ROOM');
      const order = body.data.candidates.map(
        (c: { id: string }) => c.id,
      ) as string[];
      // unusedRoom has never had this duty (count 0) so it ranks before usedRoom.
      expect(order.indexOf(unusedRoom.id)).toBeLessThan(
        order.indexOf(usedRoom.id),
      );
    });

    it('excludes rooms with no occupants from ROOM candidates', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const duty = await createDuty(event);

      const occupiedRoom = await RoomFactory.create({
        event: { connect: { id: event.id } },
      });
      const emptyRoom = await RoomFactory.create({
        event: { connect: { id: event.id } },
      });
      await BedFactory.create({
        room: { connect: { id: occupiedRoom.id } },
        registration: { connect: { id: (await createRegistration(event)).id } },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/duty-assignments/suggestions`)
        .query({ dutyId: duty.id, unit: 'ROOM' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const ids = body.data.candidates.map((c: { id: string }) => c.id);
      expect(ids).toContain(occupiedRoom.id);
      expect(ids).not.toContain(emptyRoom.id);
    });

    it('counts a room once per occurrence, not once per occupant listed as a member', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const duty = await createDuty(event);

      const room = await RoomFactory.create({
        event: { connect: { id: event.id } },
      });
      const roommateA = await createRegistration(event);
      const roommateB = await createRegistration(event);
      await BedFactory.create({
        room: { connect: { id: room.id } },
        registration: { connect: { id: roommateA.id } },
      });
      await BedFactory.create({
        room: { connect: { id: room.id } },
        registration: { connect: { id: roommateB.id } },
      });

      // A single occurrence with both roommates as members.
      await createAssignment(event, duty.id, {
        rotationUnit: 'ROOM',
        date: '2026-08-01',
        members: {
          create: [
            { registrationId: roommateA.id },
            { registrationId: roommateB.id },
          ],
        },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/duty-assignments/suggestions`)
        .query({ dutyId: duty.id, unit: 'ROOM' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const candidate = body.data.candidates.find(
        (c: { id: string }) => c.id === room.id,
      );
      expect(candidate).toHaveProperty('assignmentCount', 1);
    });
  });

  describe('POST /api/v1/events/:eventId/duty-assignments', () => {
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
        const duty = await createDuty(event);

        await request()
          .post(`/api/v1/events/${event.id}/duty-assignments`)
          .send({
            dutyId: duty.id,
            rotationUnit: 'PARTICIPANT',
            date: '2026-09-01',
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        const count = await prisma.dutyAssignment.count();
        expect(count).toBe(expectedStatus === 201 ? 1 : 0);
      },
    );

    it('should create an assignment with a rotationUnit and members', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const duty = await createDuty(event);
      const registration = await createRegistration(event);

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/duty-assignments`)
        .send({
          dutyId: duty.id,
          rotationUnit: 'ROOM',
          date: '2026-09-01',
          slot: 'Breakfast',
          registrationIds: [registration.id],
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.rotationUnit', 'ROOM');
      expect(body).toHaveProperty('data.slot', 'Breakfast');
      expect(body.data.registrationIds).toEqual([registration.id]);
    });

    it('should respond with `400` when dutyId belongs to another event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const otherEvent = await EventFactory.create();
      const otherDuty = await createDuty(otherEvent);

      await request()
        .post(`/api/v1/events/${event.id}/duty-assignments`)
        .send({
          dutyId: otherDuty.id,
          rotationUnit: 'PARTICIPANT',
          date: '2026-09-01',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      expect(await prisma.dutyAssignment.count()).toBe(0);
    });

    it('should respond with `400` when a registrationId belongs to another event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const duty = await createDuty(event);
      const otherEvent = await EventFactory.create();
      const otherRegistration = await createRegistration(otherEvent);

      await request()
        .post(`/api/v1/events/${event.id}/duty-assignments`)
        .send({
          dutyId: duty.id,
          rotationUnit: 'PARTICIPANT',
          date: '2026-09-01',
          registrationIds: [otherRegistration.id],
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      expect(await prisma.dutyAssignment.count()).toBe(0);
    });

    it.each([
      {
        label: 'dutyId is missing',
        data: { rotationUnit: 'PARTICIPANT', date: '2026-09-01' },
      },
      {
        label: 'rotationUnit is missing',
        data: { date: '2026-09-01' },
      },
      {
        label: 'rotationUnit is invalid',
        data: { rotationUnit: 'GROUP', date: '2026-09-01' },
      },
      { label: 'date is missing', data: { rotationUnit: 'PARTICIPANT' } },
      {
        label: 'date format is invalid',
        data: { rotationUnit: 'PARTICIPANT', date: '01-09-2026' },
      },
    ])('should respond with `400` when $label', async ({ data }) => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const duty = await createDuty(event);

      await request()
        .post(`/api/v1/events/${event.id}/duty-assignments`)
        .send({ dutyId: duty.id, ...data })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const event = await EventFactory.create();
      const duty = await createDuty(event);

      await request()
        .post(`/api/v1/events/${event.id}/duty-assignments`)
        .send({
          dutyId: duty.id,
          rotationUnit: 'PARTICIPANT',
          date: '2026-09-01',
        })
        .expect(401);
    });
  });

  describe('PATCH /api/v1/events/:eventId/duty-assignments/:dutyAssignmentId', () => {
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
        const duty = await createDuty(event);
        const assignment = await createAssignment(event, duty.id);

        await request()
          .patch(`/api/v1/events/${event.id}/duty-assignments/${assignment.id}`)
          .send({ slot: 'Dinner' })
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);
      },
    );

    it('should update the rotationUnit', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const duty = await createDuty(event);
      const assignment = await createAssignment(event, duty.id, {
        rotationUnit: 'PARTICIPANT',
      });

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/duty-assignments/${assignment.id}`)
        .send({ rotationUnit: 'ROOM' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.rotationUnit', 'ROOM');
    });

    it('should fully replace the member list', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const duty = await createDuty(event);
      const oldMember = await createRegistration(event);
      const newMember = await createRegistration(event);
      const assignment = await createAssignment(event, duty.id, {
        members: { create: [{ registrationId: oldMember.id }] },
      });

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/duty-assignments/${assignment.id}`)
        .send({ registrationIds: [newMember.id] })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.registrationIds).toEqual([newMember.id]);
    });

    it('should leave membership untouched when registrationIds is omitted', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const duty = await createDuty(event);
      const member = await createRegistration(event);
      const assignment = await createAssignment(event, duty.id, {
        members: { create: [{ registrationId: member.id }] },
      });

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/duty-assignments/${assignment.id}`)
        .send({ slot: 'Dinner' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.registrationIds).toEqual([member.id]);
    });

    it('should respond with `404` when the assignment does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .patch(`/api/v1/events/${event.id}/duty-assignments/${ulid()}`)
        .send({ slot: 'Dinner' })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/events/:eventId/duty-assignments/:dutyAssignmentId', () => {
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
        const duty = await createDuty(event);
        const assignment = await createAssignment(event, duty.id);

        await request()
          .delete(
            `/api/v1/events/${event.id}/duty-assignments/${assignment.id}`,
          )
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        const count = await prisma.dutyAssignment.count();
        expect(count).toBe(expectedStatus === 204 ? 0 : 1);
      },
    );

    it('should cascade-delete its members', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const duty = await createDuty(event);
      const member = await createRegistration(event);
      const assignment = await createAssignment(event, duty.id, {
        members: { create: [{ registrationId: member.id }] },
      });

      await request()
        .delete(`/api/v1/events/${event.id}/duty-assignments/${assignment.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      expect(await prisma.dutyAssignmentMember.count()).toBe(0);
    });

    it('should respond with `404` when the assignment does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .delete(`/api/v1/events/${event.id}/duty-assignments/${ulid()}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });
});
