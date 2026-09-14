import { describe, expect, it } from 'vitest';
import {
  EventFactory,
  EventManagerFactory,
  EventSettingFactory,
  OrganizationFactory,
  ProgramItemFactory,
  ProgramPublishedDayFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { request } from '../utils/request.js';
import { generateAccessToken } from './utils/token.js';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import type { Event } from '#generated/prisma/client.js';

describe('/api/v1/events/:eventId/program-public', () => {
  const createEventWithDates = async (startAt: Date, endAt: Date) =>
    EventFactory.create({
      startAt,
      endAt,
      timezone: 'UTC',
      organization: {
        create: OrganizationFactory.build({ verificationStatus: 'VERIFIED' }),
      },
    });

  const createEvent = async (
    verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED' = 'VERIFIED',
  ) =>
    EventFactory.create({
      startAt: new Date('2026-01-01T00:00:00Z'),
      endAt: new Date('2026-01-10T00:00:00Z'),
      timezone: 'UTC',
      organization: {
        create: OrganizationFactory.build({ verificationStatus }),
      },
    });

  const enablePublicProgram = async (
    event: Event,
    data: Partial<{ enabled: boolean; allowPastDates: boolean }> = {},
  ) =>
    EventSettingFactory.create({
      event: { connect: { id: event.id } },
      key: SETTING_KEYS.PROGRAM_PUBLIC,
      data: {
        enabled: true,
        allowPastDates: true,
        ...data,
      },
    });

  describe('GET /api/v1/events/:eventId/program-public', () => {
    it('is disabled when no setting has ever been stored', async () => {
      const event = await createEvent();

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/program-public`)
        .expect(200);

      expect(body.data).toEqual({ enabled: false });
    });

    it('is disabled when the setting is stored but the master switch is off', async () => {
      const event = await createEvent();
      await enablePublicProgram(event, { enabled: false });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/program-public`)
        .expect(200);

      expect(body.data).toEqual({ enabled: false });
    });

    it('refuses an unverified organization regardless of the setting', async () => {
      const event = await createEvent('PENDING');
      await enablePublicProgram(event);

      await request()
        .get(`/api/v1/events/${event.id}/program-public`)
        .expect(401);
    });

    it('reports a day with no published plan as unpublished, still giving navigation bounds', async () => {
      const event = await createEvent();
      await enablePublicProgram(event);

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/program-public`)
        .query({ date: '2026-01-05' })
        .expect(200);

      expect(body.data).toEqual({
        enabled: true,
        date: '2026-01-05',
        minDate: '2026-01-01',
        maxDate: '2026-01-10',
        published: false,
      });
    });

    it('only serves items on the requested day matching its published plan', async () => {
      const event = await createEvent();
      await enablePublicProgram(event);
      await ProgramPublishedDayFactory.create({
        event: { connect: { id: event.id } },
        date: '2026-01-05',
        plan: 'a',
      });

      const matchingPlan = await ProgramItemFactory.create({
        event: { connect: { id: event.id } },
        date: '2026-01-05',
        plan: 'a',
      });
      const bothPlan = await ProgramItemFactory.create({
        event: { connect: { id: event.id } },
        date: '2026-01-05',
        plan: 'both',
      });
      await ProgramItemFactory.create({
        event: { connect: { id: event.id } },
        date: '2026-01-05',
        plan: 'b', // wrong plan for this day
      });
      await ProgramItemFactory.create({
        event: { connect: { id: event.id } },
        date: '2026-01-06', // a different, unpublished day
        plan: 'a',
      });
      await ProgramItemFactory.create({
        event: { connect: { id: event.id } },
        date: null, // backlog — never publicly visible
        plan: 'a',
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/program-public`)
        .query({ date: '2026-01-05' })
        .expect(200);

      expect(body.data.published).toBe(true);
      expect(body.data.plan).toBe('a');
      expect(body.data.date).toBe('2026-01-05');
      expect(body.data.items.map((i: { id: string }) => i.id).sort()).toEqual(
        [matchingPlan.id, bothPlan.id].sort(),
      );
    });

    it('lets a participant browse to a future day within the event', async () => {
      const event = await createEvent();
      await enablePublicProgram(event);
      await ProgramPublishedDayFactory.create({
        event: { connect: { id: event.id } },
        date: '2026-01-09',
        plan: 'both',
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/program-public`)
        .query({ date: '2026-01-09' })
        .expect(200);

      expect(body.data).toMatchObject({ date: '2026-01-09', published: true });
    });

    it('clamps a requested date outside the event to its nearest bound', async () => {
      const event = await createEvent();
      await enablePublicProgram(event);

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/program-public`)
        .query({ date: '2030-01-01' })
        .expect(200);

      expect(body.data).toMatchObject({ date: '2026-01-10' });
    });

    describe('allowPastDates', () => {
      // Built relative to the real clock (not a fixed 2026 fixture) so these
      // exercise the actual "today" branch — freezing time with fake timers
      // would risk desyncing JWT/session expiry checks elsewhere in the
      // request. `toISODate` mirrors the service's own `YYYY-MM-DD` slicing.
      const toISODate = (date: Date) => date.toISOString().slice(0, 10);
      const daysFromNow = (offset: number) =>
        new Date(Date.now() + offset * 86_400_000);

      it('clamps browsing before today when allowPastDates is false', async () => {
        const event = await createEventWithDates(
          daysFromNow(-10),
          daysFromNow(10),
        );
        await enablePublicProgram(event, { allowPastDates: false });

        const { body } = await request()
          .get(`/api/v1/events/${event.id}/program-public`)
          .query({ date: toISODate(daysFromNow(-5)) })
          .expect(200);

        expect(body.data).toMatchObject({
          date: toISODate(daysFromNow(0)),
          minDate: toISODate(daysFromNow(0)),
        });
      });

      it('keeps the min bound within the event when it already ended and allowPastDates is false', async () => {
        const event = await createEventWithDates(
          daysFromNow(-20),
          daysFromNow(-10),
        );
        await enablePublicProgram(event, { allowPastDates: false });

        const { body } = await request()
          .get(`/api/v1/events/${event.id}/program-public`)
          .query({ date: toISODate(daysFromNow(-15)) })
          .expect(200);

        // "Today" is past the event's own last day — the min bound must
        // settle on that last day, not on today (which would put minDate
        // past maxDate and make the range invalid).
        expect(body.data).toMatchObject({
          date: toISODate(daysFromNow(-10)),
          minDate: toISODate(daysFromNow(-10)),
          maxDate: toISODate(daysFromNow(-10)),
        });
      });

      it('allows browsing before today when allowPastDates is true', async () => {
        const event = await createEventWithDates(
          daysFromNow(-10),
          daysFromNow(10),
        );
        await enablePublicProgram(event, { allowPastDates: true });

        const { body } = await request()
          .get(`/api/v1/events/${event.id}/program-public`)
          .query({ date: toISODate(daysFromNow(-5)) })
          .expect(200);

        expect(body.data).toMatchObject({ date: toISODate(daysFromNow(-5)) });
      });
    });
  });

  describe('day publish management', () => {
    const createEventWithManagerAndToken = async (role = 'DIRECTOR') => {
      const event = await createEvent();
      const user = await UserFactory.create();
      await EventManagerFactory.create({
        event: { connect: { id: event.id } },
        user: { connect: { id: user.id } },
        role,
      });
      const accessToken = generateAccessToken(user);

      return { event, accessToken };
    };

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
        .get(`/api/v1/events/${event.id}/program-public/days`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it.each([
      { method: 'get' as const, path: 'days' },
      { method: 'put' as const, path: 'days/2026-01-04' },
      { method: 'delete' as const, path: 'days/2026-01-04' },
    ])(
      'responds with 401 for $method /$path when unauthenticated',
      async ({ method, path }) => {
        const event = await createEvent();

        await request()
          [method](`/api/v1/events/${event.id}/program-public/${path}`)
          .expect(401);
      },
    );
  });
});
