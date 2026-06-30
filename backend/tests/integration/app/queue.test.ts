import { describe, expect, it } from 'vitest';
import { UserFactory } from '../../../prisma/factories/index.js';
import { request } from '../utils/request.js';
import { generateAccessToken } from './utils/token.js';
import prisma from '../utils/prisma.js';
import moment from 'moment';
import { resolve } from '#core/ioc/container';
import { QueueService } from '#app/queue/queue.service';
import { JobStatus } from '#generated/prisma/client.js';

describe('/api/v1/admin/queues', () => {
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

  describe('GET /api/v1/admin/queues/', () => {
    it('should return 200 with queue list for admin', async () => {
      const { accessToken } = await createAdminWithToken();

      const { body } = await request()
        .get('/api/v1/admin/queues/')
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toBeInstanceOf(Array);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data[0]).toMatchObject({
        name: expect.any(String),
        counts: {
          active: expect.any(Number),
          failed: expect.any(Number),
          pending: expect.any(Number),
          delayed: expect.any(Number),
        },
      });
    });

    it('should return 403 for non-admin user', async () => {
      const { accessToken } = await createUserWithToken();

      await request()
        .get('/api/v1/admin/queues/')
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should return 401 when unauthenticated', async () => {
      await request().get('/api/v1/admin/queues/').expect(401);
    });
  });

  describe('POST /api/v1/admin/queues/:queue/failed/retry', () => {
    it('should return 204 for admin with existing queue', async () => {
      const { accessToken } = await createAdminWithToken();

      await request()
        .post('/api/v1/admin/queues/mail/failed/retry')
        .auth(accessToken, { type: 'bearer' })
        .expect(204);
    });

    it('should return 404 for unknown queue', async () => {
      const { accessToken } = await createAdminWithToken();

      await request()
        .post('/api/v1/admin/queues/nonexistent-queue/failed/retry')
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should return 403 for non-admin user', async () => {
      const { accessToken } = await createUserWithToken();

      await request()
        .post('/api/v1/admin/queues/mail/failed/retry')
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should return 401 when unauthenticated', async () => {
      await request()
        .post('/api/v1/admin/queues/mail/failed/retry')
        .expect(401);
    });
  });

  describe('DELETE /api/v1/admin/queues/:queue/failed', () => {
    it('should return 204 for admin with existing queue', async () => {
      const { accessToken } = await createAdminWithToken();

      await request()
        .delete('/api/v1/admin/queues/mail/failed')
        .auth(accessToken, { type: 'bearer' })
        .expect(204);
    });

    it('should return 404 for unknown queue', async () => {
      const { accessToken } = await createAdminWithToken();

      await request()
        .delete('/api/v1/admin/queues/nonexistent-queue/failed')
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should return 403 for non-admin user', async () => {
      const { accessToken } = await createUserWithToken();

      await request()
        .delete('/api/v1/admin/queues/mail/failed')
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should return 401 when unauthenticated', async () => {
      await request().delete('/api/v1/admin/queues/mail/failed').expect(401);
    });
  });

  describe('deleteOldJobs', () => {
    it('should delete expired completed jobs', async () => {
      const jobs: { status: JobStatus; days: number }[] = [
        { status: 'PENDING', days: 1 },
        { status: 'PENDING', days: 29 },
        { status: 'PENDING', days: 31 },
        { status: 'PENDING', days: 365 },
        { status: 'RUNNING', days: 1 },
        { status: 'RUNNING', days: 29 },
        { status: 'RUNNING', days: 31 },
        { status: 'RUNNING', days: 365 },
        { status: 'COMPLETED', days: 1 },
        { status: 'COMPLETED', days: 29 },
        { status: 'COMPLETED', days: 31 }, // DELETED
        { status: 'COMPLETED', days: 365 }, // DELETED
        { status: 'FAILED', days: 1 },
        { status: 'FAILED', days: 89 },
        { status: 'FAILED', days: 91 }, // DELETED
        { status: 'FAILED', days: 365 }, // DELETED
      ];

      for (const [i, { status, days }] of jobs.entries()) {
        const executed = status === 'COMPLETED' || status === 'FAILED';

        await prisma.job.create({
          data: {
            queue: 'test-queue',
            name: `test-job-${i}`,
            status,
            createdAt: moment().subtract(32, 'days').toDate(),
            finishedAt: executed
              ? moment().subtract(days, 'days').toDate()
              : null,
            payload: {},
          },
        });
      }

      await resolve(QueueService).deleteOldJobs();

      const count = await prisma.job.count();
      expect(count).toBe(jobs.length - 4);
    });
  });
});
