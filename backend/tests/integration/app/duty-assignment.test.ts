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

  const createRegistration = async (event: Event) => {
    return RegistrationFactory.create({ event: { connect: { id: event.id } } });
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
        await DutyAssignmentFactory.create({
          event: { connect: { id: event.id } },
          duty: { connect: { id: duty.id } },
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
        .query({ dutyId: duty.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
    });

    it('should respond with `404` when the duty does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .get(`/api/v1/events/${event.id}/duty-assignments/suggestions`)
        .query({ dutyId: ulid() })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `400` when dutyId is missing', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .get(`/api/v1/events/${event.id}/duty-assignments/suggestions`)
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('ranks PARTICIPANT candidates least-assigned-first, never-assigned before assigned', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const duty = await createDuty(event, { rotationUnit: 'PARTICIPANT' });
      const assignedTwice = await createRegistration(event);
      const assignedOnce = await createRegistration(event);
      const neverAssigned = await createRegistration(event);

      await DutyAssignmentFactory.create({
        event: { connect: { id: event.id } },
        duty: { connect: { id: duty.id } },
        date: '2026-08-01',
        members: {
          create: [
            { registrationId: assignedTwice.id },
            { registrationId: assignedOnce.id },
          ],
        },
      });
      await DutyAssignmentFactory.create({
        event: { connect: { id: event.id } },
        duty: { connect: { id: duty.id } },
        date: '2026-08-10',
        members: { create: [{ registrationId: assignedTwice.id }] },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/duty-assignments/suggestions`)
        .query({ dutyId: duty.id })
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

    it('ranks ROOM candidates by the current room of historically assigned participants', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const duty = await createDuty(event, { rotationUnit: 'ROOM' });

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

      await DutyAssignmentFactory.create({
        event: { connect: { id: event.id } },
        duty: { connect: { id: duty.id } },
        date: '2026-08-01',
        members: { create: [{ registrationId: registration.id }] },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/duty-assignments/suggestions`)
        .query({ dutyId: duty.id })
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
          .send({ dutyId: duty.id, date: '2026-09-01' })
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        const count = await prisma.dutyAssignment.count();
        expect(count).toBe(expectedStatus === 201 ? 1 : 0);
      },
    );

    it('should create an assignment with members', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const duty = await createDuty(event);
      const registration = await createRegistration(event);

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/duty-assignments`)
        .send({
          dutyId: duty.id,
          date: '2026-09-01',
          slot: 'Breakfast',
          registrationIds: [registration.id],
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.slot', 'Breakfast');
      expect(body.data.registrationIds).toEqual([registration.id]);
    });

    it('should respond with `400` when dutyId belongs to another event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const otherEvent = await EventFactory.create();
      const otherDuty = await createDuty(otherEvent);

      await request()
        .post(`/api/v1/events/${event.id}/duty-assignments`)
        .send({ dutyId: otherDuty.id, date: '2026-09-01' })
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
          date: '2026-09-01',
          registrationIds: [otherRegistration.id],
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      expect(await prisma.dutyAssignment.count()).toBe(0);
    });

    it.each([
      { label: 'dutyId is missing', data: { date: '2026-09-01' } },
      { label: 'date is missing', data: {} },
      {
        label: 'date format is invalid',
        data: { date: '01-09-2026' },
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
        .send({ dutyId: duty.id, date: '2026-09-01' })
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
        const assignment = await DutyAssignmentFactory.create({
          event: { connect: { id: event.id } },
          duty: { connect: { id: duty.id } },
        });

        await request()
          .patch(`/api/v1/events/${event.id}/duty-assignments/${assignment.id}`)
          .send({ slot: 'Dinner' })
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);
      },
    );

    it('should fully replace the member list', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const duty = await createDuty(event);
      const oldMember = await createRegistration(event);
      const newMember = await createRegistration(event);
      const assignment = await DutyAssignmentFactory.create({
        event: { connect: { id: event.id } },
        duty: { connect: { id: duty.id } },
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
      const assignment = await DutyAssignmentFactory.create({
        event: { connect: { id: event.id } },
        duty: { connect: { id: duty.id } },
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
        const assignment = await DutyAssignmentFactory.create({
          event: { connect: { id: event.id } },
          duty: { connect: { id: duty.id } },
        });

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
      const assignment = await DutyAssignmentFactory.create({
        event: { connect: { id: event.id } },
        duty: { connect: { id: duty.id } },
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
