import { describe, expect, it } from 'vitest';
import {
  EventFactory,
  EventManagerFactory,
  OrganizationFactory,
  ProgramPublishedDayFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { request } from '../utils/request.js';
import { generateAccessToken } from './utils/token.js';
import type { Event } from '#generated/prisma/client.js';

describe('/api/v1/events/:eventId/program-public/days', () => {
  // Fixed 10-day range (2026-01-01..2026-01-10) so bulk-publish assertions
  // can check an exact, enumerable set of dates.
  const createEvent = async () =>
    EventFactory.create({
      startAt: new Date('2026-01-01T00:00:00Z'),
      endAt: new Date('2026-01-10T00:00:00Z'),
      timezone: 'UTC',
      organization: {
        create: OrganizationFactory.build({ verificationStatus: 'VERIFIED' }),
      },
    });

  const allEventDates = [
    '2026-01-01',
    '2026-01-02',
    '2026-01-03',
    '2026-01-04',
    '2026-01-05',
    '2026-01-06',
    '2026-01-07',
    '2026-01-08',
    '2026-01-09',
    '2026-01-10',
  ];

  const addManager = async (event: Event, role = 'DIRECTOR') => {
    const user = await UserFactory.create();
    await EventManagerFactory.create({
      event: { connect: { id: event.id } },
      user: { connect: { id: user.id } },
      role,
    });

    return generateAccessToken(user);
  };

  const createEventWithManagerAndToken = async (role = 'DIRECTOR') => {
    const event = await createEvent();
    const accessToken = await addManager(event, role);

    return { event, accessToken };
  };

  describe('GET /api/v1/events/:eventId/program-public/days', () => {
    it('lists published days for a manager', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      await ProgramPublishedDayFactory.create({
        event: { connect: { id: event.id } },
        date: '2026-01-03',
        plan: 'a',
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/program-public/days`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toMatchObject([{ date: '2026-01-03', plan: 'a' }]);
    });

    it('only lists published days for the requested event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const otherEvent = await createEvent();
      await ProgramPublishedDayFactory.create({
        event: { connect: { id: event.id } },
        date: '2026-01-03',
        plan: 'a',
      });
      await ProgramPublishedDayFactory.create({
        event: { connect: { id: otherEvent.id } },
        date: '2026-01-03',
        plan: 'b',
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/program-public/days`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toEqual([
        expect.objectContaining({ date: '2026-01-03', plan: 'a' }),
      ]);
    });

    it('refuses a user who is not a manager of the event', async () => {
      const event = await createEvent();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/events/${event.id}/program-public/days`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('responds with 401 when unauthenticated', async () => {
      const event = await createEvent();

      await request()
        .get(`/api/v1/events/${event.id}/program-public/days`)
        .expect(401);
    });
  });

  describe('PUT /api/v1/events/:eventId/program-public/days/:date', () => {
    it('publishes a day', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      const { body } = await request()
        .put(`/api/v1/events/${event.id}/program-public/days/2026-01-04`)
        .auth(accessToken, { type: 'bearer' })
        .send({ plan: 'both' })
        .expect(200);

      expect(body.data).toMatchObject({ date: '2026-01-04', plan: 'both' });
    });

    it('re-publishing an already-published day updates its plan in place', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      await ProgramPublishedDayFactory.create({
        event: { connect: { id: event.id } },
        date: '2026-01-04',
        plan: 'a',
      });

      await request()
        .put(`/api/v1/events/${event.id}/program-public/days/2026-01-04`)
        .auth(accessToken, { type: 'bearer' })
        .send({ plan: 'b' })
        .expect(200);

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/program-public/days`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      // Exactly one row for the date, now with the new plan — not a second,
      // conflicting row alongside the original.
      expect(body.data).toEqual([
        expect.objectContaining({ date: '2026-01-04', plan: 'b' }),
      ]);
    });

    it('rejects an invalid plan value', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .put(`/api/v1/events/${event.id}/program-public/days/2026-01-04`)
        .auth(accessToken, { type: 'bearer' })
        .send({ plan: 'c' })
        .expect(400);
    });

    it('refuses a viewer permission to publish a day', async () => {
      const { event, accessToken } =
        await createEventWithManagerAndToken('VIEWER');

      await request()
        .put(`/api/v1/events/${event.id}/program-public/days/2026-01-04`)
        .auth(accessToken, { type: 'bearer' })
        .send({ plan: 'both' })
        .expect(403);
    });

    it('refuses a user who is not a manager of the event', async () => {
      const event = await createEvent();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .put(`/api/v1/events/${event.id}/program-public/days/2026-01-04`)
        .auth(accessToken, { type: 'bearer' })
        .send({ plan: 'both' })
        .expect(403);
    });

    it('responds with 401 when unauthenticated', async () => {
      const event = await createEvent();

      await request()
        .put(`/api/v1/events/${event.id}/program-public/days/2026-01-04`)
        .send({ plan: 'both' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/events/:eventId/program-public/days/:date', () => {
    it('unpublishing an already-unpublished day is a no-op', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .delete(`/api/v1/events/${event.id}/program-public/days/2026-01-04`)
        .auth(accessToken, { type: 'bearer' })
        .expect(204);
    });

    it('unpublishes a previously published day', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      await ProgramPublishedDayFactory.create({
        event: { connect: { id: event.id } },
        date: '2026-01-04',
        plan: 'both',
      });

      await request()
        .delete(`/api/v1/events/${event.id}/program-public/days/2026-01-04`)
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/program-public/days`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toEqual([]);
    });

    it('refuses a viewer permission to unpublish a day', async () => {
      const { event, accessToken } =
        await createEventWithManagerAndToken('VIEWER');

      await request()
        .delete(`/api/v1/events/${event.id}/program-public/days/2026-01-04`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('refuses a user who is not a manager of the event', async () => {
      const event = await createEvent();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .delete(`/api/v1/events/${event.id}/program-public/days/2026-01-04`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('responds with 401 when unauthenticated', async () => {
      const event = await createEvent();

      await request()
        .delete(`/api/v1/events/${event.id}/program-public/days/2026-01-04`)
        .expect(401);
    });
  });

  describe('PATCH /api/v1/events/:eventId/program-public/days (bulk publish)', () => {
    it('publishes every day of the event with the given plan', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/program-public/days`)
        .auth(accessToken, { type: 'bearer' })
        .send({ plan: 'both' })
        .expect(200);

      expect(body.data).toHaveLength(allEventDates.length);
      expect(body.data.map((d: { date: string }) => d.date).sort()).toEqual(
        allEventDates,
      );
      expect(body.data.every((d: { plan: string }) => d.plan === 'both')).toBe(
        true,
      );
    });

    it('updates the plan of already-published days rather than duplicating them', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      await ProgramPublishedDayFactory.create({
        event: { connect: { id: event.id } },
        date: '2026-01-05',
        plan: 'a',
      });

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/program-public/days`)
        .auth(accessToken, { type: 'bearer' })
        .send({ plan: 'b' })
        .expect(200);

      expect(body.data).toHaveLength(allEventDates.length);
      expect(body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ date: '2026-01-05', plan: 'b' }),
        ]),
      );
    });

    it("does not touch another event's published days", async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const otherEvent = await createEvent();
      await ProgramPublishedDayFactory.create({
        event: { connect: { id: otherEvent.id } },
        date: '2026-01-05',
        plan: 'a',
      });
      const otherAccessToken = await addManager(otherEvent);

      await request()
        .patch(`/api/v1/events/${event.id}/program-public/days`)
        .auth(accessToken, { type: 'bearer' })
        .send({ plan: 'both' })
        .expect(200);

      const { body } = await request()
        .get(`/api/v1/events/${otherEvent.id}/program-public/days`)
        .auth(otherAccessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toEqual([
        expect.objectContaining({ date: '2026-01-05', plan: 'a' }),
      ]);
    });

    it('rejects an invalid plan value', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await request()
        .patch(`/api/v1/events/${event.id}/program-public/days`)
        .auth(accessToken, { type: 'bearer' })
        .send({ plan: 'c' })
        .expect(400);
    });

    it('refuses a viewer permission to bulk-publish', async () => {
      const { event, accessToken } =
        await createEventWithManagerAndToken('VIEWER');

      await request()
        .patch(`/api/v1/events/${event.id}/program-public/days`)
        .auth(accessToken, { type: 'bearer' })
        .send({ plan: 'both' })
        .expect(403);
    });

    it('refuses a user who is not a manager of the event', async () => {
      const event = await createEvent();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .patch(`/api/v1/events/${event.id}/program-public/days`)
        .auth(accessToken, { type: 'bearer' })
        .send({ plan: 'both' })
        .expect(403);
    });

    it('responds with 401 when unauthenticated', async () => {
      const event = await createEvent();

      await request()
        .patch(`/api/v1/events/${event.id}/program-public/days`)
        .send({ plan: 'both' })
        .expect(401);
    });
  });
});
