import { describe, expect, it } from 'vitest';
import moment from 'moment';
import {
  UserFactory,
  CampFactory,
  RegistrationFactory,
} from '../../../prisma/factories/index.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { generateAccessToken } from './utils/token.js';

describe('/api/v1/admin/overview', () => {
  const createAdminWithToken = async () => {
    const user = await UserFactory.create({ role: 'ADMIN' });
    const accessToken = generateAccessToken(user);

    return { user, accessToken };
  };

  const createUserWithToken = async () => {
    const user = await UserFactory.create({ role: 'USER' });
    const accessToken = generateAccessToken(user);

    return { user, accessToken };
  };

  describe('GET /api/v1/admin/overview', () => {
    it('should respond with `401` status code when unauthenticated', async () => {
      await request().get('/api/v1/admin/overview').expect(401);
    });

    it('should respond with `403` status code for non-admin user', async () => {
      const { accessToken } = await createUserWithToken();

      await request()
        .get('/api/v1/admin/overview')
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `200` status code and the overview shape for admin', async () => {
      const { accessToken } = await createAdminWithToken();

      const { body } = await request()
        .get('/api/v1/admin/overview')
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toStrictEqual({
        users: {
          total: expect.any(Number),
          unverified: expect.any(Number),
          locked: expect.any(Number),
        },
        camps: {
          total: expect.any(Number),
          open: expect.any(Number),
          upcoming: expect.any(Number),
          closed: expect.any(Number),
        },
        registrations: {
          total: expect.any(Number),
        },
        queues: {
          failedJobs: expect.any(Number),
        },
        legal: {
          total: expect.any(Number),
          configured: expect.any(Number),
        },
      });
    });

    it('should count users by verification and lock status', async () => {
      const { accessToken } = await createAdminWithToken();
      await UserFactory.create({ emailVerified: false });
      await UserFactory.create({ locked: true });
      await UserFactory.create({ emailVerified: true, locked: false });

      const { body } = await request()
        .get('/api/v1/admin/overview')
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      // The admin created for auth, plus the 3 users above.
      expect(body.data.users.total).toBe(4);
      expect(body.data.users.unverified).toBe(1);
      expect(body.data.users.locked).toBe(1);
    });

    it('should count camps by registration status', async () => {
      const { accessToken } = await createAdminWithToken();
      const now = new Date();

      // No registration window at all: counts as closed.
      await CampFactory.create({
        registrationOpensAt: null,
        registrationClosesAt: null,
      });
      // Window currently spans `now`: open.
      await CampFactory.create({
        registrationOpensAt: moment(now).subtract(1, 'day').toDate(),
        registrationClosesAt: moment(now).add(1, 'day').toDate(),
      });
      // Window already closed: closed.
      await CampFactory.create({
        registrationOpensAt: moment(now).subtract(2, 'days').toDate(),
        registrationClosesAt: moment(now).subtract(1, 'day').toDate(),
      });
      // Opens in the future: upcoming.
      await CampFactory.create({
        registrationOpensAt: moment(now).add(1, 'day').toDate(),
        registrationClosesAt: moment(now).add(2, 'days').toDate(),
      });

      const { body } = await request()
        .get('/api/v1/admin/overview')
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.camps.total).toBe(4);
      expect(body.data.camps.open).toBe(1);
      expect(body.data.camps.upcoming).toBe(1);
      expect(body.data.camps.closed).toBe(2);
    });

    it('should count total registrations, excluding soft-deleted ones', async () => {
      const { accessToken } = await createAdminWithToken();
      const camp = await CampFactory.create();

      await RegistrationFactory.create({ camp: { connect: { id: camp.id } } });
      await RegistrationFactory.create({ camp: { connect: { id: camp.id } } });
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        deletedAt: new Date(),
      });

      const { body } = await request()
        .get('/api/v1/admin/overview')
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.registrations.total).toBe(2);
    });

    it('should report zero failed jobs (the test queue driver reports none)', async () => {
      const { accessToken } = await createAdminWithToken();

      const { body } = await request()
        .get('/api/v1/admin/overview')
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.queues.failedJobs).toBe(0);
    });

    it('should report how many legal documents are configured', async () => {
      const { accessToken } = await createAdminWithToken();
      await prisma.legalDocument.create({
        data: { type: 'IMPRINT', content: 'Imprint content' },
      });

      const { body } = await request()
        .get('/api/v1/admin/overview')
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.legal).toStrictEqual({ total: 2, configured: 1 });
    });

    it('should report no configured legal documents when none are set', async () => {
      const { accessToken } = await createAdminWithToken();

      const { body } = await request()
        .get('/api/v1/admin/overview')
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.legal).toStrictEqual({ total: 2, configured: 0 });
    });
  });
});
