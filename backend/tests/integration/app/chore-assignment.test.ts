import { describe, expect, it } from 'vitest';
import {
  ChoreAssignmentFactory,
  ChoreFactory,
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

describe('/api/v1/events/:eventId/chore-assignments', () => {
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

  const createChore = async (
    event: Event,
    data?: Partial<Parameters<typeof ChoreFactory.create>[0]>,
  ) => {
    return ChoreFactory.create({
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
    choreId: string,
    data?: Partial<Parameters<typeof ChoreAssignmentFactory.create>[0]>,
  ) => {
    return ChoreAssignmentFactory.create({
      event: { connect: { id: event.id } },
      chore: { connect: { id: choreId } },
      rotationUnit: 'PARTICIPANT',
      ...data,
    });
  };

  describe('GET /api/v1/events/:eventId/chore-assignments', () => {
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
        const chore = await createChore(event);
        const registration = await createRegistration(event);
        await createAssignment(event, chore.id, {
          date: '2026-09-01',
          slot: 'Lunch',
          members: { create: [{ registrationId: registration.id }] },
        });

        const response = await request()
          .get(`/api/v1/events/${event.id}/chore-assignments`)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        expect(response.body.data).toHaveLength(1);
        const item = response.body.data[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('choreId', chore.id);
        expect(item).toHaveProperty('chore.id', chore.id);
        expect(item).toHaveProperty('chore.name', chore.name);
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
        .get(`/api/v1/events/${event.id}/chore-assignments`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const event = await EventFactory.create();

      await request()
        .get(`/api/v1/events/${event.id}/chore-assignments`)
        .expect(401);
    });
  });

  describe('GET /api/v1/events/:eventId/chore-assignments/:choreAssignmentId', () => {
    it('should return the assignment', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);
      const assignment = await createAssignment(event, chore.id);

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/chore-assignments/${assignment.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.id', assignment.id);
    });

    it('should respond with `404` when the assignment does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .get(`/api/v1/events/${event.id}/chore-assignments/${ulid()}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('GET /api/v1/events/:eventId/chore-assignments/suggestions', () => {
    it('respects route ordering — "suggestions" is not treated as an id', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);

      await request()
        .get(`/api/v1/events/${event.id}/chore-assignments/suggestions`)
        .query({ choreId: chore.id, unit: 'PARTICIPANT' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
    });

    it('should respond with `404` when the chore does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .get(`/api/v1/events/${event.id}/chore-assignments/suggestions`)
        .query({ choreId: ulid(), unit: 'PARTICIPANT' })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it.each([
      { label: 'choreId is missing', query: { unit: 'PARTICIPANT' } },
      { label: 'unit is missing', query: {} },
      {
        label: 'unit is invalid',
        query: { unit: 'GROUP' },
        withChore: true,
      },
    ])(
      'should respond with `400` when $label',
      async ({ query, withChore }) => {
        const { event, accessToken } = await createEventWithManagerAndToken();
        const choreId = withChore ? (await createChore(event)).id : undefined;

        await request()
          .get(`/api/v1/events/${event.id}/chore-assignments/suggestions`)
          .query({ ...query, ...(choreId ? { choreId } : {}) })
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      },
    );

    it('ranks PARTICIPANT candidates least-assigned-first, never-assigned before assigned', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);
      const assignedTwice = await createRegistration(event);
      const assignedOnce = await createRegistration(event);
      // A second never-assigned registration ties with `neverAssigned` on
      // both count and lastAssignedAt, exercising the tied-run shuffle.
      const neverAssigned = await createRegistration(event);
      const alsoNeverAssigned = await createRegistration(event);

      await createAssignment(event, chore.id, {
        date: '2026-08-01',
        members: {
          create: [
            { registrationId: assignedTwice.id },
            { registrationId: assignedOnce.id },
          ],
        },
      });
      await createAssignment(event, chore.id, {
        date: '2026-08-10',
        members: { create: [{ registrationId: assignedTwice.id }] },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/chore-assignments/suggestions`)
        .query({ choreId: chore.id, unit: 'PARTICIPANT' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.unit).toBe('PARTICIPANT');
      const order = body.data.candidates.map(
        (c: { id: string }) => c.id,
      ) as string[];
      // Both never-assigned registrations must rank ahead of the assigned
      // ones — their relative order between each other is randomized by the
      // tie-shuffle, so it isn't asserted on.
      expect(order.indexOf(neverAssigned.id)).toBeLessThan(
        order.indexOf(assignedOnce.id),
      );
      expect(order.indexOf(alsoNeverAssigned.id)).toBeLessThan(
        order.indexOf(assignedOnce.id),
      );
      expect(order.indexOf(assignedOnce.id)).toBeLessThan(
        order.indexOf(assignedTwice.id),
      );
    });

    it('excludes staff from PARTICIPANT candidates when excludeStaff is set', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event, { excludeStaff: true });
      const participant = await createRegistration(event, {
        role: 'participant',
      });
      const staff = await createRegistration(event, { role: 'counselor' });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/chore-assignments/suggestions`)
        .query({ choreId: chore.id, unit: 'PARTICIPANT' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const ids = body.data.candidates.map((c: { id: string }) => c.id);
      expect(ids).toContain(participant.id);
      expect(ids).not.toContain(staff.id);
    });

    it('ranks ROOM candidates by the current room of historically assigned participants', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);

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
      // Occupied but never assigned this chore — must still be a candidate,
      // as opposed to a genuinely empty room (see the "excludes empty rooms"
      // test below).
      await BedFactory.create({
        room: { connect: { id: unusedRoom.id } },
        registration: { connect: { id: (await createRegistration(event)).id } },
      });

      await createAssignment(event, chore.id, {
        rotationUnit: 'ROOM',
        date: '2026-08-01',
        members: { create: [{ registrationId: registration.id }] },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/chore-assignments/suggestions`)
        .query({ choreId: chore.id, unit: 'ROOM' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.unit).toBe('ROOM');
      const order = body.data.candidates.map(
        (c: { id: string }) => c.id,
      ) as string[];
      // unusedRoom has never had this chore (count 0) so it ranks before usedRoom.
      expect(order.indexOf(unusedRoom.id)).toBeLessThan(
        order.indexOf(usedRoom.id),
      );
    });

    it('excludes rooms with no occupants from ROOM candidates', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);

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
        .get(`/api/v1/events/${event.id}/chore-assignments/suggestions`)
        .query({ choreId: chore.id, unit: 'ROOM' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const ids = body.data.candidates.map((c: { id: string }) => c.id);
      expect(ids).toContain(occupiedRoom.id);
      expect(ids).not.toContain(emptyRoom.id);
    });

    it('counts a room once per occurrence, not once per occupant listed as a member', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);

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
      await createAssignment(event, chore.id, {
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
        .get(`/api/v1/events/${event.id}/chore-assignments/suggestions`)
        .query({ choreId: chore.id, unit: 'ROOM' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const candidate = body.data.candidates.find(
        (c: { id: string }) => c.id === room.id,
      );
      expect(candidate).toHaveProperty('assignmentCount', 1);
    });

    it('ignores history from a member who no longer occupies any room', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);

      // Never given a bed — the historical assignment still references them.
      const roomless = await createRegistration(event);
      await createAssignment(event, chore.id, {
        rotationUnit: 'ROOM',
        date: '2026-08-01',
        members: { create: [{ registrationId: roomless.id }] },
      });

      const room = await RoomFactory.create({
        event: { connect: { id: event.id } },
      });
      await BedFactory.create({
        room: { connect: { id: room.id } },
        registration: { connect: { id: (await createRegistration(event)).id } },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/chore-assignments/suggestions`)
        .query({ choreId: chore.id, unit: 'ROOM' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const candidate = body.data.candidates.find(
        (c: { id: string }) => c.id === room.id,
      );
      expect(candidate).toHaveProperty('assignmentCount', 0);
    });

    it('excludes staff-only rooms from ROOM candidates when excludeStaff is set', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event, { excludeStaff: true });

      const participantRoom = await RoomFactory.create({
        event: { connect: { id: event.id } },
      });
      await BedFactory.create({
        room: { connect: { id: participantRoom.id } },
        registration: {
          connect: {
            id: (await createRegistration(event, { role: 'participant' })).id,
          },
        },
      });

      const staffRoom = await RoomFactory.create({
        event: { connect: { id: event.id } },
      });
      await BedFactory.create({
        room: { connect: { id: staffRoom.id } },
        registration: {
          connect: {
            id: (await createRegistration(event, { role: 'counselor' })).id,
          },
        },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/chore-assignments/suggestions`)
        .query({ choreId: chore.id, unit: 'ROOM' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const ids = body.data.candidates.map((c: { id: string }) => c.id);
      expect(ids).toContain(participantRoom.id);
      expect(ids).not.toContain(staffRoom.id);
    });

    it('ranks the longest-unassigned candidate first when assignment counts are tied', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);
      const assignedLongAgo = await createRegistration(event);
      const assignedRecently = await createRegistration(event);

      await createAssignment(event, chore.id, {
        date: '2026-01-01',
        members: { create: [{ registrationId: assignedLongAgo.id }] },
      });
      await createAssignment(event, chore.id, {
        date: '2026-08-01',
        members: { create: [{ registrationId: assignedRecently.id }] },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/chore-assignments/suggestions`)
        .query({ choreId: chore.id, unit: 'PARTICIPANT' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const order = body.data.candidates.map(
        (c: { id: string }) => c.id,
      ) as string[];
      expect(order.indexOf(assignedLongAgo.id)).toBeLessThan(
        order.indexOf(assignedRecently.id),
      );
    });

    it('interleaves PARTICIPANT candidates by country when balanceCountries is set', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event, { balanceCountries: true });

      // Distinct assignment counts, so fairness ranking alone (no tie) would
      // list both `gb` candidates before the `fr` one.
      const gbNeverAssigned = await createRegistration(event, {
        country: 'gb',
      });
      const gbAssignedOnce = await createRegistration(event, {
        country: 'gb',
      });
      const frAssignedTwice = await createRegistration(event, {
        country: 'fr',
      });

      await createAssignment(event, chore.id, {
        date: '2026-08-01',
        members: {
          create: [
            { registrationId: gbAssignedOnce.id },
            { registrationId: frAssignedTwice.id },
          ],
        },
      });
      await createAssignment(event, chore.id, {
        date: '2026-08-05',
        members: { create: [{ registrationId: frAssignedTwice.id }] },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/chore-assignments/suggestions`)
        .query({ choreId: chore.id, unit: 'PARTICIPANT' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const order = body.data.candidates.map(
        (c: { id: string }) => c.id,
      ) as string[];
      // Fairness alone would rank [gbNeverAssigned, gbAssignedOnce,
      // frAssignedTwice] — balancing interleaves the `fr` candidate between
      // the two `gb` ones instead of leaving it last.
      expect(order).toEqual([
        gbNeverAssigned.id,
        frAssignedTwice.id,
        gbAssignedOnce.id,
      ]);
    });
  });

  describe('POST /api/v1/events/:eventId/chore-assignments', () => {
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
        const chore = await createChore(event);

        await request()
          .post(`/api/v1/events/${event.id}/chore-assignments`)
          .send({
            choreId: chore.id,
            rotationUnit: 'PARTICIPANT',
            date: '2026-09-01',
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        const count = await prisma.choreAssignment.count();
        expect(count).toBe(expectedStatus === 201 ? 1 : 0);
      },
    );

    it('should create an assignment with a rotationUnit and members', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);
      const registration = await createRegistration(event);

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/chore-assignments`)
        .send({
          choreId: chore.id,
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

    it('should respond with `404` when choreId belongs to another event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const otherEvent = await EventFactory.create();
      const otherChore = await createChore(otherEvent);

      await request()
        .post(`/api/v1/events/${event.id}/chore-assignments`)
        .send({
          choreId: otherChore.id,
          rotationUnit: 'PARTICIPANT',
          date: '2026-09-01',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);

      expect(await prisma.choreAssignment.count()).toBe(0);
    });

    it('should respond with `400` when a registrationId belongs to another event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);
      const otherEvent = await EventFactory.create();
      const otherRegistration = await createRegistration(otherEvent);

      await request()
        .post(`/api/v1/events/${event.id}/chore-assignments`)
        .send({
          choreId: chore.id,
          rotationUnit: 'PARTICIPANT',
          date: '2026-09-01',
          registrationIds: [otherRegistration.id],
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      expect(await prisma.choreAssignment.count()).toBe(0);
    });

    it('should respond with `400` when choreId is missing', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .post(`/api/v1/events/${event.id}/chore-assignments`)
        .send({ rotationUnit: 'PARTICIPANT', date: '2026-09-01' })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it.each([
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
      const chore = await createChore(event);

      await request()
        .post(`/api/v1/events/${event.id}/chore-assignments`)
        .send({ choreId: chore.id, ...data })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const event = await EventFactory.create();
      const chore = await createChore(event);

      await request()
        .post(`/api/v1/events/${event.id}/chore-assignments`)
        .send({
          choreId: chore.id,
          rotationUnit: 'PARTICIPANT',
          date: '2026-09-01',
        })
        .expect(401);
    });
  });

  describe('PATCH /api/v1/events/:eventId/chore-assignments/:choreAssignmentId', () => {
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
        const chore = await createChore(event);
        const assignment = await createAssignment(event, chore.id);

        await request()
          .patch(
            `/api/v1/events/${event.id}/chore-assignments/${assignment.id}`,
          )
          .send({ slot: 'Dinner' })
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);
      },
    );

    it('should update the rotationUnit', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);
      const assignment = await createAssignment(event, chore.id, {
        rotationUnit: 'PARTICIPANT',
      });

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/chore-assignments/${assignment.id}`)
        .send({ rotationUnit: 'ROOM' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.rotationUnit', 'ROOM');
    });

    it('should update the choreId, moving the assignment to a different chore', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);
      const otherChore = await createChore(event);
      const assignment = await createAssignment(event, chore.id);

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/chore-assignments/${assignment.id}`)
        .send({ choreId: otherChore.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.choreId', otherChore.id);
    });

    it('should respond with `400` when choreId belongs to another event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);
      const otherEvent = await EventFactory.create();
      const otherChore = await createChore(otherEvent);
      const assignment = await createAssignment(event, chore.id);

      await request()
        .patch(`/api/v1/events/${event.id}/chore-assignments/${assignment.id}`)
        .send({ choreId: otherChore.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should fully replace the member list', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);
      const oldMember = await createRegistration(event);
      const newMember = await createRegistration(event);
      const assignment = await createAssignment(event, chore.id, {
        members: { create: [{ registrationId: oldMember.id }] },
      });

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/chore-assignments/${assignment.id}`)
        .send({ registrationIds: [newMember.id] })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.registrationIds).toEqual([newMember.id]);
    });

    it('should leave membership untouched when registrationIds is omitted', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);
      const member = await createRegistration(event);
      const assignment = await createAssignment(event, chore.id, {
        members: { create: [{ registrationId: member.id }] },
      });

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/chore-assignments/${assignment.id}`)
        .send({ slot: 'Dinner' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.registrationIds).toEqual([member.id]);
    });

    it('should respond with `404` when the assignment does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .patch(`/api/v1/events/${event.id}/chore-assignments/${ulid()}`)
        .send({ slot: 'Dinner' })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/events/:eventId/chore-assignments/:choreAssignmentId', () => {
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
        const chore = await createChore(event);
        const assignment = await createAssignment(event, chore.id);

        await request()
          .delete(
            `/api/v1/events/${event.id}/chore-assignments/${assignment.id}`,
          )
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        const count = await prisma.choreAssignment.count();
        expect(count).toBe(expectedStatus === 204 ? 0 : 1);
      },
    );

    it('should cascade-delete its members', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);
      const member = await createRegistration(event);
      const assignment = await createAssignment(event, chore.id, {
        members: { create: [{ registrationId: member.id }] },
      });

      await request()
        .delete(`/api/v1/events/${event.id}/chore-assignments/${assignment.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      expect(await prisma.choreAssignmentMember.count()).toBe(0);
    });

    it('should respond with `404` when the assignment does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .delete(`/api/v1/events/${event.id}/chore-assignments/${ulid()}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });
});
