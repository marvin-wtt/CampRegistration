import { describe, expect, it } from 'vitest';
import * as OTPAuth from 'otpauth';
import {
  ADMIN_TOTP_SECRET,
  AdminAccessGrantFactory,
  EventFactory,
  EventManagerFactory,
  NewsletterFactory,
  OrganizationFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { generateAccessToken } from './utils/token.js';

const currentCode = () =>
  new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(ADMIN_TOTP_SECRET),
    digits: 6,
    period: 30,
  }).generate();

const createAdmin = async () => {
  const user = await UserFactory.create({ role: 'ADMIN' });

  return { user, accessToken: generateAccessToken(user) };
};

describe('administrator access', () => {
  describe('scoped guards', () => {
    it('refuses an administrator without a grant with ADMIN_ACCESS_REQUIRED', async () => {
      const event = await EventFactory.create();
      const { accessToken } = await createAdmin();

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/registrations`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      expect(body.errorCode).toBe('ADMIN_ACCESS_REQUIRED');
    });

    it('lets an administrator with an active grant through', async () => {
      const event = await EventFactory.create();
      const { user, accessToken } = await createAdmin();
      await AdminAccessGrantFactory.create({
        userId: user.id,
        scope: 'event',
        scopeId: event.id,
      });

      await request()
        .get(`/api/v1/events/${event.id}/registrations`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
    });

    it('passes an administrator on their own role without a grant', async () => {
      const event = await EventFactory.create();
      const { user, accessToken } = await createAdmin();
      await EventManagerFactory.create({
        event: { connect: { id: event.id } },
        user: { connect: { id: user.id } },
        role: 'VIEWER',
      });

      await request()
        .get(`/api/v1/events/${event.id}/registrations`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      // Viewers can't delete; that part still needs a grant.
      const { body } = await request()
        .delete(`/api/v1/events/${event.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
      expect(body.errorCode).toBe('ADMIN_ACCESS_REQUIRED');
    });

    it.each([
      ['expired', { expiresAt: new Date(Date.now() - 1000) }],
      ['ended', { endedAt: new Date() }],
    ])('refuses an %s grant', async (_, overrides) => {
      const event = await EventFactory.create();
      const { user, accessToken } = await createAdmin();
      await AdminAccessGrantFactory.create({
        userId: user.id,
        scope: 'event',
        scopeId: event.id,
        ...overrides,
      });

      await request()
        .get(`/api/v1/events/${event.id}/registrations`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('does not open another event with a grant for one', async () => {
      const event = await EventFactory.create();
      const other = await EventFactory.create();
      const { user, accessToken } = await createAdmin();
      await AdminAccessGrantFactory.create({
        userId: user.id,
        scope: 'event',
        scopeId: event.id,
      });

      await request()
        .get(`/api/v1/events/${other.id}/registrations`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it("does not open an organization's events with a grant for the organization", async () => {
      const organization = await OrganizationFactory.create();
      const event = await EventFactory.create({
        organization: { connect: { id: organization.id } },
      });
      const { user, accessToken } = await createAdmin();
      await AdminAccessGrantFactory.create({
        userId: user.id,
        scope: 'organization',
        scopeId: organization.id,
      });

      await request()
        .get(`/api/v1/organizations/${organization.id}/members`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
      await request()
        .get(`/api/v1/events/${event.id}/registrations`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('keeps admin-only routes open without a grant', async () => {
      const { accessToken } = await createAdmin();

      await request()
        .get('/api/v1/admin/overview')
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
      await request()
        .get('/api/v1/organizations?view=all')
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
    });
  });

  describe('POST /api/v1/admin/access-grants', () => {
    it('grants access with a reason and a current code, and audits it', async () => {
      const event = await EventFactory.create();
      const { user, accessToken } = await createAdmin();

      const { body } = await request()
        .post('/api/v1/admin/access-grants')
        .send({
          scope: 'event',
          scopeId: event.id,
          reason: 'Support ticket 42',
          otp: currentCode(),
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data).toMatchObject({
        scope: 'event',
        scopeId: event.id,
        reason: 'Support ticket 42',
        endedAt: null,
      });

      const entry = await prisma.auditLog.findFirstOrThrow({
        where: { entityType: 'adminAccessGrant', entityId: body.data.id },
      });
      expect(entry).toMatchObject({
        action: 'granted',
        eventId: event.id,
        actorId: user.id,
      });
      // The reason is free text and stays on the grant.
      expect(JSON.stringify(entry.details)).not.toContain('Support ticket');

      await request()
        .get(`/api/v1/events/${event.id}/registrations`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
    });

    it('refuses a wrong code', async () => {
      const event = await EventFactory.create();
      const { accessToken } = await createAdmin();

      await request()
        .post('/api/v1/admin/access-grants')
        .send({
          scope: 'event',
          scopeId: event.id,
          reason: 'Support ticket 42',
          otp: '000000',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      expect(await prisma.adminAccessGrant.count()).toBe(0);
    });

    it('refuses a missing subject', async () => {
      const newsletter = await NewsletterFactory.create();
      await prisma.newsletter.delete({ where: { id: newsletter.id } });
      const { accessToken } = await createAdmin();

      await request()
        .post('/api/v1/admin/access-grants')
        .send({
          scope: 'newsletter',
          scopeId: newsletter.id,
          reason: 'Support ticket 42',
          otp: currentCode(),
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('refuses a second active grant for the same subject', async () => {
      const event = await EventFactory.create();
      const { user, accessToken } = await createAdmin();
      await AdminAccessGrantFactory.create({
        userId: user.id,
        scope: 'event',
        scopeId: event.id,
      });

      await request()
        .post('/api/v1/admin/access-grants')
        .send({
          scope: 'event',
          scopeId: event.id,
          reason: 'Support ticket 42',
          otp: currentCode(),
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(409);
    });

    it('is for administrators only', async () => {
      const event = await EventFactory.create();
      const user = await UserFactory.create();

      await request()
        .post('/api/v1/admin/access-grants')
        .send({
          scope: 'event',
          scopeId: event.id,
          reason: 'Support ticket 42',
          otp: '123456',
        })
        .auth(generateAccessToken(user), { type: 'bearer' })
        .expect(403);
    });
  });

  describe('DELETE /api/v1/admin/access-grants/:grantId', () => {
    it('ends the grant early and audits it', async () => {
      const event = await EventFactory.create();
      const { user, accessToken } = await createAdmin();
      const grant = await AdminAccessGrantFactory.create({
        userId: user.id,
        scope: 'event',
        scopeId: event.id,
      });

      await request()
        .delete(`/api/v1/admin/access-grants/${grant.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      await request()
        .get(`/api/v1/events/${event.id}/registrations`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
      expect(
        await prisma.auditLog.count({
          where: { entityId: grant.id, action: 'ended' },
        }),
      ).toBe(1);
    });

    it("does not end another administrator's grant", async () => {
      const event = await EventFactory.create();
      const { user } = await createAdmin();
      const { accessToken } = await createAdmin();
      const grant = await AdminAccessGrantFactory.create({
        userId: user.id,
        scope: 'event',
        scopeId: event.id,
      });

      await request()
        .delete(`/api/v1/admin/access-grants/${grant.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('GET /api/v1/profile', () => {
    it('lists the active grants', async () => {
      const event = await EventFactory.create();
      const { user, accessToken } = await createAdmin();
      const grant = await AdminAccessGrantFactory.create({
        userId: user.id,
        scope: 'event',
        scopeId: event.id,
      });
      await AdminAccessGrantFactory.create({
        userId: user.id,
        scope: 'event',
        scopeId: event.id,
        endedAt: new Date(),
      });

      const { body } = await request()
        .get('/api/v1/profile')
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.adminAccess).toEqual([
        expect.objectContaining({ id: grant.id, scopeId: event.id }),
      ]);
    });
  });
});
