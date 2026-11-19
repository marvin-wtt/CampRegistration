import { beforeEach, describe, expect, it } from 'vitest';
import moment from 'moment';
import {
  EventFactory,
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
  const endAt = moment()
    .add(days, 'days')
    .subtract(RETENTION_MONTHS, 'months')
    .toDate();
  const event = await EventFactory.create({
    organization: { connect: { id: organization.id } },
    endAt,
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

const deadline = (eventId: string, kind: string) =>
  prisma.retentionDeadline.findUniqueOrThrow({
    where: { eventId_kind: { eventId, kind } },
  });

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

      const [sensitive, registrations] = body.data.deadlines;
      expect(sensitive.kind).toBe('sensitive');
      expect(registrations.kind).toBe('registrations');
      expect(moment(sensitive.dueAt).diff(moment(event.endAt), 'weeks')).toBe(
        SENSITIVE_WEEKS,
      );
      expect(new Date(sensitive.dueAt) <= new Date(registrations.dueAt)).toBe(
        true,
      );
      expect(body.data.registrationCount).toBe(1);
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
  });

  describe('reminders', () => {
    it('should send each stage once and nothing beyond 30 days', async () => {
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
      expect(mailsTo(user.email)).toHaveLength(2);
      expect((await deadline(event.id, 'registrations')).notifiedStage).toBe(
        30,
      );
      expect((await deadline(event.id, 'sensitive')).notifiedStage).toBe(0);
      expect(mailsTo(far.user.email)).toHaveLength(0);
    });

    it('should tell the organization admins on the deadline', async () => {
      const { organization } = await eventDue(-1);
      const admin = await UserFactory.create();
      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: admin.id,
          role: 'ADMIN',
        },
      });

      await run();

      expect(mailsTo(admin.email).length).toBeGreaterThan(0);
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
      kind: string,
      until: string,
      reason = 'Open insurance claim',
    ) =>
      request()
        .post(`/api/v1/events/${eventId}/retention/${kind}/postpone`)
        .send({ reason, until })
        .auth(token, { type: 'bearer' });

    it('should move the deadline and restart its reminders', async () => {
      const { event, token } = await eventDue(5);
      await run();
      const until = moment.utc().add(3, 'months').format('YYYY-MM-DD');

      await postpone(event.id, token, 'registrations', until).expect(200);

      const updated = await deadline(event.id, 'registrations');
      expect(moment.utc(updated.postponedUntil).format('YYYY-MM-DD')).toBe(
        until,
      );
      expect(updated.postponeReason).toBe('Open insurance claim');
      expect(updated.notifiedStage).toBeNull();

      const audit = await prisma.auditLog.findFirstOrThrow({
        where: { eventId: event.id, action: 'postponed' },
      });
      expect(JSON.stringify(audit.details)).not.toContain('insurance');
    });

    it('should refuse a date more than 12 months ahead', async () => {
      const { event, token } = await eventDue(5);
      await run();

      await postpone(
        event.id,
        token,
        'registrations',
        moment.utc().add(13, 'months').format('YYYY-MM-DD'),
      ).expect(422);
    });

    it('should keep the sensitive deadline before the general one', async () => {
      const { event, token } = await eventDue(5);
      await run();

      await postpone(
        event.id,
        token,
        'sensitive',
        moment.utc().add(2, 'months').format('YYYY-MM-DD'),
      ).expect(422);
    });

    it('should require a reason', async () => {
      const { event, token } = await eventDue(5);
      await run();

      await postpone(
        event.id,
        token,
        'registrations',
        moment.utc().add(1, 'months').format('YYYY-MM-DD'),
        ' ',
      ).expect(400);
    });

    it('should refuse managers who cannot delete registrations', async () => {
      const { event, token } = await eventDue(5, { role: 'COUNSELOR' });
      await run();

      await postpone(
        event.id,
        token,
        'registrations',
        moment.utc().add(1, 'months').format('YYYY-MM-DD'),
      ).expect(403);
    });
  });

  describe('purging', () => {
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
      expect(retention.body.data.deadlines[0].status).toBe('resolved');
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
        .post(`/api/v1/events/${event.id}/retention/sensitive/purge`)
        .send({ confirm: true })
        .auth(token, { type: 'bearer' })
        .expect(204);

      await request()
        .post(`/api/v1/events/${event.id}/retention/sensitive/postpone`)
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
      await run();
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

    it('should list open deadlines only for platform administrators', async () => {
      await eventDue(10);
      await run();
      const admin = await UserFactory.create({ role: 'ADMIN' });
      const user = await UserFactory.create();

      await request()
        .get('/api/v1/admin/retention')
        .auth(generateAccessToken(user), { type: 'bearer' })
        .expect(403);
      const { body } = await request()
        .get('/api/v1/admin/retention')
        .auth(generateAccessToken(admin), { type: 'bearer' })
        .expect(200);

      expect(body.data).toHaveLength(2);
    });
  });
});
