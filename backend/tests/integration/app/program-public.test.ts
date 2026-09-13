import { describe, expect, it } from 'vitest';
import {
  EventFactory,
  EventSettingFactory,
  OrganizationFactory,
  ProgramItemFactory,
} from '../../../prisma/factories/index.js';
import { request } from '../utils/request.js';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import type { Event } from '#generated/prisma/client.js';

describe('/api/v1/events/:eventId/program-public', () => {
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
    data: Partial<{
      enabled: boolean;
      publishedDays: Record<string, 'a' | 'b' | 'both'>;
    }> = {},
  ) =>
    EventSettingFactory.create({
      event: { connect: { id: event.id } },
      key: SETTING_KEYS.PROGRAM_PUBLIC,
      data: {
        enabled: true,
        publishedDays: {},
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
      await enablePublicProgram(event, {
        publishedDays: { '2026-01-05': 'a' },
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
      await enablePublicProgram(event, {
        publishedDays: { '2026-01-09': 'both' },
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
  });
});
