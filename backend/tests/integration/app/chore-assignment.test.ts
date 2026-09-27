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

  const createSlot = async (choreId: string, name = 'Lunch') => {
    return prisma.choreSlot.create({ data: { choreId, name } });
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
      rotationUnit: 'PERSON',
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
        const slot = await createSlot(chore.id);
        const registration = await createRegistration(event);
        await createAssignment(event, chore.id, {
          date: '2026-09-01',
          choreSlot: { connect: { id: slot.id } },
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
        expect(item).toHaveProperty('rotationUnit', 'PERSON');
        expect(item).toHaveProperty('date', '2026-09-01');
        expect(item).toHaveProperty('slotId', slot.id);
        expect(item).toHaveProperty('status', 'PLANNED');
        expect(item).toHaveProperty('note', null);
        expect(item.members).toEqual([
          { registrationId: registration.id, role: 'MEMBER', missed: false },
        ]);
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
        .query({ choreId: chore.id, unit: 'PERSON' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
    });

    it('should respond with `404` when the chore does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .get(`/api/v1/events/${event.id}/chore-assignments/suggestions`)
        .query({ choreId: ulid(), unit: 'PERSON' })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it.each([
      { label: 'choreId is missing', query: { unit: 'PERSON' } },
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

    it('ranks PERSON candidates least-assigned-first, never-assigned before assigned', async () => {
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
        .query({ choreId: chore.id, unit: 'PERSON' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.unit).toBe('PERSON');
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

    it('excludes staff from PERSON candidates for a participant duty', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event, { eligibility: 'PARTICIPANTS' });
      const participant = await createRegistration(event, {
        role: 'participant',
      });
      const staff = await createRegistration(event, { role: 'counselor' });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/chore-assignments/suggestions`)
        .query({ choreId: chore.id, unit: 'PERSON' })
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

    it('excludes staff-only rooms from ROOM candidates for a participant duty', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event, { eligibility: 'PARTICIPANTS' });

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
        .query({ choreId: chore.id, unit: 'PERSON' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const order = body.data.candidates.map(
        (c: { id: string }) => c.id,
      ) as string[];
      expect(order.indexOf(assignedLongAgo.id)).toBeLessThan(
        order.indexOf(assignedRecently.id),
      );
    });

    it('interleaves PERSON candidates by country when balanceCountries is set', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event, { balanceCountries: true });
      const otherChore = await createChore(event);

      // One duty each, so all three tie on load — balancing only reorders
      // within such a tie. The finer tie-breakers (times on this chore, then
      // longest ago) still separate them, so the fairness order is fixed.
      const gbNeverAssigned = await createRegistration(event, {
        country: 'gb',
      });
      const gbAssignedOnce = await createRegistration(event, {
        country: 'gb',
      });
      const frAssignedLater = await createRegistration(event, {
        country: 'fr',
      });

      await createAssignment(event, otherChore.id, {
        date: '2026-08-01',
        members: { create: [{ registrationId: gbNeverAssigned.id }] },
      });
      await createAssignment(event, chore.id, {
        date: '2026-08-01',
        members: { create: [{ registrationId: gbAssignedOnce.id }] },
      });
      await createAssignment(event, chore.id, {
        date: '2026-08-05',
        members: { create: [{ registrationId: frAssignedLater.id }] },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/chore-assignments/suggestions`)
        .query({ choreId: chore.id, unit: 'PERSON' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const order = body.data.candidates.map(
        (c: { id: string }) => c.id,
      ) as string[];
      // Fairness alone would rank [gbNeverAssigned, gbAssignedOnce,
      // frAssignedLater] — balancing interleaves the `fr` candidate between
      // the two `gb` ones instead of leaving it last.
      expect(order).toEqual([
        gbNeverAssigned.id,
        frAssignedLater.id,
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
            rotationUnit: 'PERSON',
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
      const slot = await createSlot(chore.id, 'Breakfast');
      const registration = await createRegistration(event);

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/chore-assignments`)
        .send({
          choreId: chore.id,
          rotationUnit: 'ROOM',
          date: '2026-09-01',
          slotId: slot.id,
          note: 'Bring gloves',
          members: [{ registrationId: registration.id }],
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.rotationUnit', 'ROOM');
      expect(body).toHaveProperty('data.slotId', slot.id);
      expect(body).toHaveProperty('data.note', 'Bring gloves');
      expect(body.data.members).toEqual([
        { registrationId: registration.id, role: 'MEMBER', missed: false },
      ]);
    });

    it('should respond with `400` when the slot belongs to another chore', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);
      const otherSlot = await createSlot((await createChore(event)).id);

      await request()
        .post(`/api/v1/events/${event.id}/chore-assignments`)
        .send({
          choreId: chore.id,
          rotationUnit: 'PERSON',
          date: '2026-09-01',
          slotId: otherSlot.id,
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should auto-fill members and supervisors from the slot', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event, {
        eligibility: 'PARTICIPANTS',
        supervisorCount: 1,
      });
      const slot = await prisma.choreSlot.create({
        data: { choreId: chore.id, name: 'Dinner', headcount: 2 },
      });
      const busy = await createRegistration(event, { role: 'participant' });
      const fresh = await createRegistration(event, { role: 'participant' });
      const alsoFresh = await createRegistration(event, {
        role: 'participant',
      });
      const counselor = await createRegistration(event, { role: 'counselor' });
      // Already did a duty — the other two are fairer picks.
      await createAssignment(event, chore.id, {
        date: '2026-08-01',
        members: { create: [{ registrationId: busy.id }] },
      });

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/chore-assignments`)
        .send({
          choreId: chore.id,
          rotationUnit: 'PERSON',
          date: '2026-09-01',
          slotId: slot.id,
          autoFill: true,
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      const members = body.data.members as {
        registrationId: string;
        role: string;
      }[];
      expect(
        members
          .filter((m) => m.role === 'MEMBER')
          .map((m) => m.registrationId)
          .sort(),
      ).toEqual([fresh.id, alsoFresh.id].sort());
      expect(members.filter((m) => m.role === 'SUPERVISOR')).toEqual([
        { registrationId: counselor.id, role: 'SUPERVISOR', missed: false },
      ]);
    });

    it('should respond with `404` when choreId belongs to another event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const otherEvent = await EventFactory.create();
      const otherChore = await createChore(otherEvent);

      await request()
        .post(`/api/v1/events/${event.id}/chore-assignments`)
        .send({
          choreId: otherChore.id,
          rotationUnit: 'PERSON',
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
          rotationUnit: 'PERSON',
          date: '2026-09-01',
          members: [{ registrationId: otherRegistration.id }],
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      expect(await prisma.choreAssignment.count()).toBe(0);
    });

    it('should respond with `400` when choreId is missing', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .post(`/api/v1/events/${event.id}/chore-assignments`)
        .send({ rotationUnit: 'PERSON', date: '2026-09-01' })
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
      { label: 'date is missing', data: { rotationUnit: 'PERSON' } },
      {
        label: 'date format is invalid',
        data: { rotationUnit: 'PERSON', date: '01-09-2026' },
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
          rotationUnit: 'PERSON',
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
          .send({ note: 'Dinner' })
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);
      },
    );

    it('should update the rotationUnit', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);
      const assignment = await createAssignment(event, chore.id, {
        rotationUnit: 'PERSON',
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
        .send({ members: [{ registrationId: newMember.id }] })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.members).toEqual([
        { registrationId: newMember.id, role: 'MEMBER', missed: false },
      ]);
    });

    it('should update status, note and missed members', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);
      const member = await createRegistration(event);
      const assignment = await createAssignment(event, chore.id, {
        members: { create: [{ registrationId: member.id }] },
      });

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/chore-assignments/${assignment.id}`)
        .send({
          status: 'DONE',
          note: 'Went well',
          members: [{ registrationId: member.id, missed: true }],
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.status', 'DONE');
      expect(body).toHaveProperty('data.note', 'Went well');
      expect(body.data.members[0]).toHaveProperty('missed', true);
    });

    it('should leave membership untouched when members is omitted', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);
      const member = await createRegistration(event);
      const assignment = await createAssignment(event, chore.id, {
        members: { create: [{ registrationId: member.id }] },
      });

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/chore-assignments/${assignment.id}`)
        .send({ note: 'Dinner' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.members).toEqual([
        { registrationId: member.id, role: 'MEMBER', missed: false },
      ]);
    });

    it('should respond with `404` when the assignment does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .patch(`/api/v1/events/${event.id}/chore-assignments/${ulid()}`)
        .send({ note: 'Dinner' })
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

  describe('POST /api/v1/events/:eventId/chore-assignments/:choreAssignmentId/fill', () => {
    it('tops up to the headcount without touching existing members', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event, { defaultCount: 2 });
      const existing = await createRegistration(event);
      const other = await createRegistration(event);
      const assignment = await createAssignment(event, chore.id, {
        date: '2026-09-01',
        members: { create: [{ registrationId: existing.id }] },
      });

      const { body } = await request()
        .post(
          `/api/v1/events/${event.id}/chore-assignments/${assignment.id}/fill`,
        )
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const ids = body.data.members.map(
        (m: { registrationId: string }) => m.registrationId,
      ) as string[];
      expect(ids.sort()).toEqual([existing.id, other.id].sort());
    });

    it('should respond with `403` when user is VIEWER', async () => {
      const { event, accessToken } =
        await createEventWithManagerAndToken('VIEWER');
      const chore = await createChore(event, { defaultCount: 1 });
      const assignment = await createAssignment(event, chore.id);

      await request()
        .post(
          `/api/v1/events/${event.id}/chore-assignments/${assignment.id}/fill`,
        )
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });
  });

  describe('POST /api/v1/events/:eventId/chore-assignments/series', () => {
    const planSeries = async (
      eventId: string,
      accessToken: string,
      body: Record<string, unknown>,
      expectedStatus = 201,
    ) =>
      request()
        .post(`/api/v1/events/${eventId}/chore-assignments/series`)
        .send({ rotationUnit: 'PERSON', onConflict: 'SKIP', ...body })
        .auth(accessToken, { type: 'bearer' })
        .expect(expectedStatus);

    it('plans one duty per day and slot, spread evenly', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event, { defaultCount: 1 });
      const breakfast = await createSlot(chore.id, 'Breakfast');
      const dinner = await createSlot(chore.id, 'Dinner');
      const people = await Promise.all(
        [1, 2, 3].map(() => createRegistration(event)),
      );

      const { body } = await planSeries(event.id, accessToken, {
        choreId: chore.id,
        slotIds: [breakfast.id, dinner.id],
        from: '2026-09-01',
        to: '2026-09-03',
      });

      expect(body.data).toMatchObject({ created: 6, filled: 0, skipped: 0 });
      const assignments = await prisma.choreAssignment.findMany({
        include: { members: true },
      });
      expect(assignments).toHaveLength(6);
      expect(new Set(assignments.map((a) => a.batchId))).toEqual(
        new Set([body.data.batchId]),
      );

      const counts = people.map(
        (person) =>
          assignments.filter((a) =>
            a.members.some((m) => m.registrationId === person.id),
          ).length,
      );
      expect(counts).toEqual([2, 2, 2]);
    });

    it('honours the weekday filter', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);

      // 2026-09-05 is a Saturday, 2026-09-06 a Sunday.
      const { body } = await planSeries(event.id, accessToken, {
        choreId: chore.id,
        slotIds: [],
        from: '2026-09-04',
        to: '2026-09-07',
        weekdays: [0, 6],
      });

      expect(body.data.created).toBe(2);
      const dates = (await prisma.choreAssignment.findMany()).map((a) =>
        a.date.toISOString().slice(0, 10),
      );
      expect(dates.sort()).toEqual(['2026-09-05', '2026-09-06']);
    });

    it.each([
      { onConflict: 'SKIP', created: 1, filled: 0, skipped: 1, members: 1 },
      { onConflict: 'FILL', created: 1, filled: 1, skipped: 0, members: 2 },
      { onConflict: 'REPLACE', created: 2, filled: 0, skipped: 0, members: 2 },
    ])(
      'handles an existing duty with $onConflict',
      async ({ onConflict, created, filled, skipped, members }) => {
        const { event, accessToken } = await createEventWithManagerAndToken();
        const chore = await createChore(event, { defaultCount: 2 });
        const kept = await createRegistration(event);
        await Promise.all([1, 2, 3].map(() => createRegistration(event)));
        await createAssignment(event, chore.id, {
          date: '2026-09-01',
          members: { create: [{ registrationId: kept.id }] },
        });

        const { body } = await planSeries(event.id, accessToken, {
          choreId: chore.id,
          slotIds: [],
          from: '2026-09-01',
          to: '2026-09-02',
          onConflict,
        });

        expect(body.data).toMatchObject({ created, filled, skipped });
        const first = await prisma.choreAssignment.findFirstOrThrow({
          where: { date: new Date('2026-09-01') },
          include: { members: true },
        });
        expect(first.members).toHaveLength(members);
      },
    );

    it('never touches a duty that is already done', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event, { defaultCount: 1 });
      await createRegistration(event);
      const done = await createAssignment(event, chore.id, {
        date: '2026-09-01',
        status: 'DONE',
      });

      const { body } = await planSeries(event.id, accessToken, {
        choreId: chore.id,
        slotIds: [],
        from: '2026-09-01',
        to: '2026-09-01',
        onConflict: 'REPLACE',
      });

      expect(body.data).toMatchObject({ created: 0, skipped: 1 });
      expect(body.data.batchId).toBeNull();
      await expect(
        prisma.choreAssignment.findUnique({ where: { id: done.id } }),
      ).resolves.not.toBeNull();
    });

    it.each([
      { role: 'COUNSELOR', expectedStatus: 201 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } =
          await createEventWithManagerAndToken(role);
        const chore = await createChore(event);

        await planSeries(
          event.id,
          accessToken,
          {
            choreId: chore.id,
            slotIds: [],
            from: '2026-09-01',
            to: '2026-09-01',
          },
          expectedStatus,
        );
      },
    );

    it.each([
      { label: 'the range is reversed', from: '2026-09-05', to: '2026-09-01' },
      { label: 'the range is too long', from: '2026-01-01', to: '2027-12-31' },
    ])('should respond with `400` when $label', async ({ from, to }) => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);

      await planSeries(
        event.id,
        accessToken,
        { choreId: chore.id, slotIds: [], from, to },
        400,
      );
    });
  });

  describe('DELETE /api/v1/events/:eventId/chore-assignments', () => {
    it('deletes a whole series by batch', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);
      const batchId = ulid();
      await createAssignment(event, chore.id, { batchId });
      await createAssignment(event, chore.id, { batchId });
      await createAssignment(event, chore.id);

      const { body } = await request()
        .delete(`/api/v1/events/${event.id}/chore-assignments`)
        .query({ batchId })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.count).toBe(2);
      expect(await prisma.choreAssignment.count()).toBe(1);
    });

    it('deletes by chore and date range', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);
      const other = await createChore(event);
      await createAssignment(event, chore.id, { date: '2026-09-01' });
      await createAssignment(event, chore.id, { date: '2026-09-05' });
      await createAssignment(event, other.id, { date: '2026-09-01' });

      await request()
        .delete(`/api/v1/events/${event.id}/chore-assignments`)
        .query({ choreId: chore.id, from: '2026-09-01', to: '2026-09-02' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(await prisma.choreAssignment.count()).toBe(2);
    });

    it('deletes only the listed chores', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const [a, b, hidden] = await Promise.all(
        [1, 2, 3].map(() => createChore(event)),
      );
      await Promise.all(
        [a, b, hidden].map((chore) =>
          createAssignment(event, chore.id, { date: '2026-09-01' }),
        ),
      );

      await request()
        .delete(`/api/v1/events/${event.id}/chore-assignments`)
        .query({
          choreId: `${a.id},${b.id}`,
          from: '2026-09-01',
          to: '2026-09-01',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const remaining = await prisma.choreAssignment.findMany();
      expect(remaining.map((assignment) => assignment.choreId)).toEqual([
        hidden.id,
      ]);
    });

    it('does not delete duties of another event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const otherEvent = await EventFactory.create();
      const otherChore = await createChore(otherEvent);
      await createAssignment(otherEvent, otherChore.id);

      await request()
        .delete(`/api/v1/events/${event.id}/chore-assignments`)
        .query({ choreId: otherChore.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(await prisma.choreAssignment.count()).toBe(1);
    });

    it('should respond with `400` without a filter', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);
      await createAssignment(event, chore.id);

      await request()
        .delete(`/api/v1/events/${event.id}/chore-assignments`)
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      expect(await prisma.choreAssignment.count()).toBe(1);
    });

    it('should respond with `403` when user is VIEWER', async () => {
      const { event, accessToken } =
        await createEventWithManagerAndToken('VIEWER');

      await request()
        .delete(`/api/v1/events/${event.id}/chore-assignments`)
        .query({ batchId: ulid() })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });
  });

  describe('DELETE /api/v1/events/:eventId/chore-assignments/members/:registrationId', () => {
    const membersOf = async (choreAssignmentId: string) =>
      (
        await prisma.choreAssignmentMember.findMany({
          where: { choreAssignmentId },
        })
      ).map((member) => member.registrationId);

    it('removes the person from planned duties in the range and refills', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);
      const sick = await createRegistration(event);
      const replacement = await createRegistration(event);
      const before = await createAssignment(event, chore.id, {
        date: '2026-08-31',
        members: { create: [{ registrationId: sick.id }] },
      });
      const inRange = await createAssignment(event, chore.id, {
        date: '2026-09-01',
        members: { create: [{ registrationId: sick.id }] },
      });
      const done = await createAssignment(event, chore.id, {
        date: '2026-09-02',
        status: 'DONE',
        members: { create: [{ registrationId: sick.id }] },
      });

      const { body } = await request()
        .delete(
          `/api/v1/events/${event.id}/chore-assignments/members/${sick.id}`,
        )
        .query({ from: '2026-09-01', replace: true })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toEqual({ removed: 1, replaced: 1 });
      expect(await membersOf(before.id)).toEqual([sick.id]);
      expect(await membersOf(inRange.id)).toEqual([replacement.id]);
      expect(await membersOf(done.id)).toEqual([sick.id]);
    });

    it('only removes when replace is off', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);
      const sick = await createRegistration(event);
      await createRegistration(event);
      const assignment = await createAssignment(event, chore.id, {
        date: '2026-09-01',
        members: { create: [{ registrationId: sick.id }] },
      });

      const { body } = await request()
        .delete(
          `/api/v1/events/${event.id}/chore-assignments/members/${sick.id}`,
        )
        .query({ from: '2026-09-01', replace: false })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toEqual({ removed: 1, replaced: 0 });
      expect(await membersOf(assignment.id)).toEqual([]);
    });

    it('should respond with `400` for a registration of another event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const other = await createRegistration(await EventFactory.create());

      await request()
        .delete(
          `/api/v1/events/${event.id}/chore-assignments/members/${other.id}`,
        )
        .query({ from: '2026-09-01', replace: true })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });
  });

  describe('GET /api/v1/events/:eventId/chore-assignments/fairness', () => {
    it('reports duties, supervisions and missed duties per person', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event, { effort: 'HEAVY' });
      const participant = await createRegistration(event, {
        role: 'participant',
      });
      const idle = await createRegistration(event, { role: 'participant' });
      const counselor = await createRegistration(event, { role: 'counselor' });
      await createAssignment(event, chore.id, {
        members: {
          create: [
            { registrationId: participant.id },
            { registrationId: counselor.id, role: 'SUPERVISOR' },
            { registrationId: idle.id, missed: true },
          ],
        },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/chore-assignments/fairness`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const byId = new Map(
        (body.data as { registrationId: string }[]).map((entry) => [
          entry.registrationId,
          entry,
        ]),
      );
      expect(byId.get(participant.id)).toMatchObject({
        dutyCount: 1,
        heavyCount: 1,
        balance: 'ABOVE',
      });
      expect(byId.get(idle.id)).toMatchObject({
        dutyCount: 0,
        missedCount: 1,
        balance: 'BELOW',
      });
      expect(byId.get(counselor.id)).toMatchObject({
        dutyCount: 0,
        supervisionCount: 1,
      });
    });
  });

  describe('POST /api/v1/events/:eventId/chore-assignments/auto-fill', () => {
    it('suggests members without saving anything', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const chore = await createChore(event);
      await Promise.all([1, 2, 3].map(() => createRegistration(event)));

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/chore-assignments/auto-fill`)
        .send({
          choreId: chore.id,
          date: '2026-09-01',
          rotationUnit: 'PERSON',
          headcount: 2,
          members: [],
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toHaveLength(2);
      expect(await prisma.choreAssignment.count()).toBe(0);
    });
  });
});
