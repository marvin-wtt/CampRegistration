import { beforeEach, describe, expect, it } from 'vitest';
import moment from 'moment';
import {
  EventFactory,
  FileFactory,
  OrganizationFactory,
  PrivacyNoticeFactory,
  RegistrationFactory,
  UserFactory,
  completePrivacyNoticeContent,
} from '../../../prisma/factories/index.js';
import prisma from '../utils/prisma.js';
import { request } from '../utils/request.js';
import { mailer } from '../utils/mailer.js';
import { generateAccessToken } from './utils/token.js';
import { resolve } from '#core/ioc/container';
import { RetentionReminderService } from '#app/retention/retention-reminder.service';
import type { EventRetentionDeadlineKind } from '@camp-registration/common/privacy';
import {
  addToDate,
  currentDateInTimeZone,
  dateInTimeZone,
  zonedInstant,
} from '@camp-registration/common/utils';

const RETENTION_MONTHS = 24;
const SENSITIVE_WEEKS = 4;

const FORM = {
  pages: [
    {
      name: 'page',
      elements: [
        { type: 'text', name: 'first_name' },
        { type: 'comment', name: 'allergies', privacyCategory: 'allergies' },
      ],
    },
  ],
};

const notice = completePrivacyNoticeContent({
  retention: {
    months: RETENTION_MONTHS,
    anchor: 'event_end',
    exceptions: [],
    specialCategories: { weeks: SENSITIVE_WEEKS, anchor: 'event_end' },
  },
});

/** An event whose general deadline is `days` away (negative: passed). */
async function eventDue(
  days: number,
  {
    role = 'DIRECTOR',
    form = FORM,
  }: { role?: string; form?: Record<string, unknown> } = {},
) {
  const organization = await OrganizationFactory.create(
    { verificationStatus: 'VERIFIED' },
    { privacyNotice: null },
  );
  const version = await PrivacyNoticeFactory.createPublished(
    organization.id,
    notice,
  );
  // Noon of the day that puts the deadline `days` away, in the event's zone.
  const timezone = 'Europe/Berlin';
  const endDay = addToDate(inDays({ timezone }, days), {
    months: -RETENTION_MONTHS,
  });
  const endAt = zonedInstant(`${endDay}T12:00:00`, timezone);
  const event = await EventFactory.create({
    organization: { connect: { id: organization.id } },
    startAt: moment(endAt).subtract(7, 'days').toDate(),
    endAt,
    timezone,
    form,
  });
  const registration = await RegistrationFactory.create({
    event: { connect: { id: event.id } },
    data: { first_name: 'Ada', allergies: 'Peanuts' },
    organizationPrivacyNotice: { connect: { id: version.id } },
  });

  const user = await UserFactory.create();
  await prisma.eventManager.create({
    data: { eventId: event.id, userId: user.id, role },
  });

  return {
    event,
    organization,
    registration,
    user,
    token: generateAccessToken(user),
  };
}

const run = () => resolve(RetentionReminderService).run();

const state = (eventId: string, kind: EventRetentionDeadlineKind) =>
  prisma.eventRetentionState.findUnique({
    where: { eventId_kind: { eventId, kind } },
  });

/** Today, moved by `days`, in the event's time zone. */
const inDays = (event: { timezone: string }, days: number) =>
  addToDate(currentDateInTimeZone(event.timezone), { days });

const mailsTo = (email: string) =>
  (
    mailer.sendMail as unknown as {
      mock: { calls: [{ to: { address: string } | string }][] };
    }
  ).mock.calls.filter(([mail]) =>
    typeof mail.to === 'string' ? mail.to === email : mail.to.address === email,
  );

describe('retention workflow', () => {
  beforeEach(async () => {
    await prisma.event.deleteMany();
  });

  describe('GET /api/v1/events/:eventId/retention', () => {
    it('should derive both deadlines from the stamped notice', async () => {
      const { event, token } = await eventDue(100);

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/retention`)
        .auth(token, { type: 'bearer' })
        .expect(200);

      const eventEnd = dateInTimeZone(event.endAt, event.timezone);
      const [sensitive, registrations] = body.data.deadlines;
      expect(sensitive).toMatchObject({
        kind: 'sensitive',
        dueAt: addToDate(eventEnd, { days: SENSITIVE_WEEKS * 7 }),
      });
      expect(registrations).toMatchObject({
        kind: 'registrations',
        dueAt: addToDate(eventEnd, { months: RETENTION_MONTHS }),
        status: 'upcoming',
      });
    });

    it('should have no sensitive deadline for a form without sensitive questions', async () => {
      const { event, token } = await eventDue(100, {
        form: {
          pages: [
            { name: 'p', elements: [{ type: 'text', name: 'first_name' }] },
          ],
        },
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/retention`)
        .auth(token, { type: 'bearer' })
        .expect(200);

      expect(body.data.deadlines.map((d: { kind: string }) => d.kind)).toEqual([
        'registrations',
      ]);
    });

    it('should drop the sensitive deadline once the form stops asking', async () => {
      const { event, token } = await eventDue(100);
      const show = () =>
        request()
          .get(`/api/v1/events/${event.id}/retention`)
          .auth(token, { type: 'bearer' })
          .expect(200);
      await show();

      await prisma.event.update({
        where: { id: event.id },
        data: {
          form: {
            pages: [
              { name: 'p', elements: [{ type: 'text', name: 'first_name' }] },
            ],
          },
        },
      });
      const { body } = await show();

      expect(body.data.deadlines.map((d: { kind: string }) => d.kind)).toEqual([
        'registrations',
      ]);
    });
  });

  describe('reminders', () => {
    it('should send each stage once, nothing beyond 30 days or long overdue', async () => {
      // Without sensitive questions only the general deadline exists.
      const far = await eventDue(200, {
        form: {
          pages: [
            { name: 'p', elements: [{ type: 'text', name: 'first_name' }] },
          ],
        },
      });
      const { event, user } = await eventDue(10);

      await run();
      await run();

      // The sensitive deadline passed long ago, the general one is 10 days off.
      expect(mailsTo(user.email)).toHaveLength(1);
      expect(await state(event.id, 'registrations')).toMatchObject({
        remindedFor: inDays(event, 10),
        remindedStage: 30,
      });
      expect(await state(event.id, 'sensitive')).toBeNull();
      expect(mailsTo(far.user.email)).toHaveLength(0);
    });

    it('should still remind of a deadline passed within the last week', async () => {
      const { event, user } = await eventDue(-3, {
        form: {
          pages: [
            { name: 'p', elements: [{ type: 'text', name: 'first_name' }] },
          ],
        },
      });

      await run();

      expect(mailsTo(user.email)).toHaveLength(1);
      expect((await state(event.id, 'registrations'))?.remindedStage).toBe(0);
    });

    it('should stop once the data is deleted', async () => {
      const { event, user, token } = await eventDue(-1);

      await request()
        .post(`/api/v1/events/${event.id}/retention/registrations/purge`)
        .send({ confirm: true })
        .auth(token, { type: 'bearer' })
        .expect(204);
      await run();

      expect(mailsTo(user.email)).toHaveLength(0);
    });
  });

  describe('POST /api/v1/events/:eventId/retention/:kind/postpone', () => {
    const postpone = (
      eventId: string,
      token: string,
      until: string,
      reason = 'Open insurance claim',
    ) =>
      request()
        .post(`/api/v1/events/${eventId}/retention/registrations/postpone`)
        .send({ reason, until })
        .auth(token, { type: 'bearer' });

    it('should move the deadline and restart its reminders', async () => {
      const { event, token, user } = await eventDue(5, {
        form: {
          pages: [
            { name: 'p', elements: [{ type: 'text', name: 'first_name' }] },
          ],
        },
      });
      await run();
      const until = inDays(event, 20);

      const { body } = await postpone(event.id, token, until).expect(200);

      expect(body.data.deadlines[0]).toMatchObject({
        effectiveAt: until,
        postponement: { until, reason: 'Open insurance claim' },
      });
      const updated = await state(event.id, 'registrations');
      expect(updated?.postponedUntil).toBe(until);

      // A new date, so its reminders start over.
      await run();
      expect(mailsTo(user.email)).toHaveLength(2);

      const audit = await prisma.auditLog.findFirstOrThrow({
        where: { eventId: event.id, action: 'postponed' },
      });
      expect(JSON.stringify(audit.details)).not.toContain('insurance');
    });

    it('should refuse a date more than 12 months ahead', async () => {
      const { event, token } = await eventDue(5);

      await postpone(
        event.id,
        token,
        moment.utc().add(13, 'months').format('YYYY-MM-DD'),
      ).expect(422);
    });

    it('should refuse a date before the current deadline', async () => {
      const { event, token } = await eventDue(100);

      await postpone(
        event.id,
        token,
        moment.utc().add(1, 'months').format('YYYY-MM-DD'),
      ).expect(422);
    });

    it('should require a reason', async () => {
      const { event, token } = await eventDue(5);

      await postpone(
        event.id,
        token,
        moment.utc().add(1, 'months').format('YYYY-MM-DD'),
        ' ',
      ).expect(400);
    });

    it('should refuse managers who cannot delete registrations', async () => {
      const { event, token } = await eventDue(5, { role: 'COUNSELOR' });

      await postpone(
        event.id,
        token,
        moment.utc().add(1, 'months').format('YYYY-MM-DD'),
      ).expect(403);
    });
  });

  describe('purging', () => {
    it('should detach files uploaded to sensitive questions only', async () => {
      const { event, registration, token } = await eventDue(-1, {
        form: {
          pages: [
            {
              name: 'page',
              elements: [
                { type: 'file', name: 'passport' },
                {
                  type: 'file',
                  name: 'vaccination',
                  privacyCategory: 'health',
                },
              ],
            },
          ],
        },
      });
      const owned = { registration: { connect: { id: registration.id } } };
      const passport = await FileFactory.create(owned);
      const vaccination = await FileFactory.create(owned);
      await prisma.registration.update({
        where: { id: registration.id },
        data: { data: { passport: passport.id, vaccination: vaccination.id } },
      });

      await request()
        .post(`/api/v1/events/${event.id}/retention/sensitive/purge`)
        .send({ confirm: true })
        .auth(token, { type: 'bearer' })
        .expect(204);

      const files = await prisma.file.findMany({
        where: { id: { in: [passport.id, vaccination.id] } },
        select: { id: true, registrationId: true },
      });
      // Detached files are removed by the nightly unassigned-file cleanup.
      expect(
        files.find((f) => f.id === vaccination.id)?.registrationId,
      ).toBeNull();
      expect(files.find((f) => f.id === passport.id)?.registrationId).toBe(
        registration.id,
      );
      const stored = await prisma.registration.findUniqueOrThrow({
        where: { id: registration.id },
      });
      expect(stored.data).toEqual({ passport: passport.id });
    });

    it('should clear the column copy of a sensitive answer', async () => {
      const { event, registration, token } = await eventDue(-1, {
        form: {
          pages: [
            {
              name: 'page',
              elements: [
                {
                  type: 'text',
                  name: 'gender',
                  eventDataType: 'gender',
                  privacyCategory: 'health',
                },
              ],
            },
          ],
        },
      });
      await prisma.registration.update({
        where: { id: registration.id },
        data: { data: { gender: 'female' }, gender: 'female' },
      });

      await request()
        .post(`/api/v1/events/${event.id}/retention/sensitive/purge`)
        .send({ confirm: true })
        .auth(token, { type: 'bearer' })
        .expect(204);

      const stored = await prisma.registration.findUniqueOrThrow({
        where: { id: registration.id },
      });
      expect(stored.data).toEqual({});
      expect(stored.gender).toBeNull();
    });

    it('should clear sensitive answers and close registrations for good', async () => {
      const { event, registration, token } = await eventDue(-1);

      await request()
        .post(`/api/v1/events/${event.id}/retention/sensitive/purge`)
        .send({ confirm: true })
        .auth(token, { type: 'bearer' })
        .expect(204);

      const stored = await prisma.registration.findUniqueOrThrow({
        where: { id: registration.id },
      });
      expect(stored.data).toEqual({ first_name: 'Ada' });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}`)
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(body.data.sensitiveDataPurgedAt).not.toBeNull();
      expect(body.data.registrationStatus).toBe('closed');

      const retention = await request()
        .get(`/api/v1/events/${event.id}/retention`)
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(retention.body.data.purged.sensitive).not.toBeNull();
      expect(
        retention.body.data.deadlines.map((d: { kind: string }) => d.kind),
      ).toEqual(['registrations']);
    });

    it('should refuse an edit that brings sensitive answers back', async () => {
      const { event, registration, token } = await eventDue(-1);
      await request()
        .post(`/api/v1/events/${event.id}/retention/sensitive/purge`)
        .send({ confirm: true })
        .auth(token, { type: 'bearer' })
        .expect(204);
      const url = `/api/v1/events/${event.id}/registrations/${registration.id}`;

      await request()
        .patch(url)
        .send({ data: { first_name: 'Ada', allergies: 'Peanuts' } })
        .auth(token, { type: 'bearer' })
        .expect(400);

      await request()
        .patch(url)
        .send({ data: { first_name: 'Grace' } })
        .auth(token, { type: 'bearer' })
        .expect(200);
      const stored = await prisma.registration.findUniqueOrThrow({
        where: { id: registration.id },
      });
      expect(stored.data).toEqual({ first_name: 'Grace' });
    });

    it('should delete all registrations and imply the sensitive purge', async () => {
      const { event, token } = await eventDue(-1);

      await request()
        .post(`/api/v1/events/${event.id}/retention/registrations/purge`)
        .send({ confirm: true })
        .auth(token, { type: 'bearer' })
        .expect(204);

      expect(
        await prisma.registration.count({ where: { eventId: event.id } }),
      ).toBe(0);
      const stored = await prisma.event.findUniqueOrThrow({
        where: { id: event.id },
      });
      expect(stored.registrationDataPurgedAt).not.toBeNull();
      expect(stored.sensitiveDataPurgedAt).not.toBeNull();

      await request()
        .post(`/api/v1/events/${event.id}/retention/registrations/purge`)
        .send({ confirm: true })
        .auth(token, { type: 'bearer' })
        .expect(204);
    });

    it('should close an open registration for good, its window untouched', async () => {
      const { event, token } = await eventDue(-1);
      const window = {
        registrationOpensAt: moment()
          .subtract(1, 'day')
          .startOf('second')
          .toDate(),
        registrationClosesAt: moment()
          .add(1, 'month')
          .startOf('second')
          .toDate(),
      };
      await prisma.event.update({ where: { id: event.id }, data: window });

      await request()
        .post(`/api/v1/events/${event.id}/retention/sensitive/purge`)
        .send({ confirm: true })
        .auth(token, { type: 'bearer' })
        .expect(204);

      const { body } = await request()
        .get(`/api/v1/events/${event.id}`)
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(body.data.registrationStatus).toBe('closed');
      const stored = await prisma.event.findUniqueOrThrow({
        where: { id: event.id },
      });
      expect(stored.registrationClosesAt).toEqual(window.registrationClosesAt);

      // The edit page sends the window along with every save: unchanged, it
      // saves; moved, it is refused.
      await request()
        .patch(`/api/v1/events/${event.id}`)
        .send({
          registrationOpensAt: window.registrationOpensAt.toISOString(),
          registrationClosesAt: window.registrationClosesAt.toISOString(),
        })
        .auth(token, { type: 'bearer' })
        .expect(200);
      await request()
        .patch(`/api/v1/events/${event.id}`)
        .send({ registrationClosesAt: moment().add(2, 'months').toISOString() })
        .auth(token, { type: 'bearer' })
        .expect(409);
    });

    it('should require an explicit confirmation', async () => {
      const { event, token } = await eventDue(-1);

      await request()
        .post(`/api/v1/events/${event.id}/retention/registrations/purge`)
        .send({})
        .auth(token, { type: 'bearer' })
        .expect(400);
    });

    it('should refuse postponing what was deleted', async () => {
      const { event, token } = await eventDue(-1);
      await request()
        .post(`/api/v1/events/${event.id}/retention/registrations/purge`)
        .send({ confirm: true })
        .auth(token, { type: 'bearer' })
        .expect(204);

      await request()
        .post(`/api/v1/events/${event.id}/retention/registrations/postpone`)
        .send({
          reason: 'x',
          until: moment.utc().add(1, 'days').format('YYYY-MM-DD'),
        })
        .auth(token, { type: 'bearer' })
        .expect(409);
    });
  });

  describe('overviews', () => {
    it('should list open deadlines for organization members', async () => {
      const { event, organization } = await eventDue(10);
      const member = await UserFactory.create();
      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: member.id,
          role: 'ADMIN',
        },
      });

      const { body } = await request()
        .get(`/api/v1/organizations/${organization.id}/retention`)
        .auth(generateAccessToken(member), { type: 'bearer' })
        .expect(200);

      expect(body.data).toHaveLength(2);
      expect(body.data[0]).toMatchObject({ eventId: event.id });
      expect(JSON.stringify(body.data)).not.toContain('reason');
    });
  });
});
