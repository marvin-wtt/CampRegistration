import { describe, expect, it } from 'vitest';
import prisma from '../utils/prisma.js';
import { generateAccessToken } from './utils/token.js';
import {
  EventFactory,
  RegistrationFactory,
  UserFactory,
  EventManagerFactory,
} from '../../../prisma/factories';
import { type Event, type Prisma } from '#generated/prisma/client.js';
import { ulid } from 'ulidx';
import moment from 'moment';
import { request } from '../utils/request.js';
import { resolve } from '#core/ioc/container';
import { AuditService } from '#app/audit/audit.service';

describe('/api/v1/events/:eventId/registrations/:registrationId/audit', () => {
  const createEventWithManagerAndToken = async (
    eventData: Partial<Prisma.EventCreateInput> = {},
    role = 'DIRECTOR',
  ) => {
    const event = await EventFactory.create(eventData);
    const user = await UserFactory.create();
    const manager = await EventManagerFactory.create({
      event: { connect: { id: event.id } },
      user: { connect: { id: user.id } },
      role,
    });
    const accessToken = generateAccessToken(user);

    return { event, user, manager, accessToken };
  };

  const createRegistration = async (
    event: Event,
    data?: Partial<Prisma.RegistrationCreateInput>,
  ) => {
    return RegistrationFactory.create({
      ...data,
      event: { connect: { id: event.id } },
    });
  };

  const fetchAudit = (eventId: string, registrationId: string, token: string) =>
    request()
      .get(`/api/v1/events/${eventId}/registrations/${registrationId}/audit`)
      .auth(token, { type: 'bearer' });

  describe('GET .../audit', () => {
    it('records a status change with actor and changed field names only', async () => {
      const { event, user, accessToken } =
        await createEventWithManagerAndToken();
      const registration = await createRegistration(event, {
        status: 'PENDING',
      });

      await request()
        .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
        .send({ status: 'ACCEPTED' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const response = await fetchAudit(
        event.id,
        registration.id,
        accessToken,
      ).expect(200);

      const entries = response.body.data;
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        action: 'updated',
        entityType: 'registration',
        entityId: registration.id,
        eventId: event.id,
        actor: { id: user.id, name: user.name },
      });
      // Status is a bounded, non-PII field — its new value is recorded so the
      // timeline can show the outcome.
      expect(entries[0].changes.changedValues).toEqual({ status: 'ACCEPTED' });
      expect(entries[0].changes.changedFields).toBeUndefined();
    });

    it('records a data edit by changed leaf path only', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const registration = await createRegistration(event, {
        data: { first_name: 'Ann', notes: 'x' },
      });

      await request()
        .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
        .send({ data: { first_name: 'Bob', notes: 'x' } })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const response = await fetchAudit(
        event.id,
        registration.id,
        accessToken,
      ).expect(200);

      const entry = response.body.data[0];
      expect(entry.action).toBe('updated');
      expect(entry.changes.changedFields).toContain('data.first_name');
      expect(entry.changes.changedFields).not.toContain('data.notes');
      // The new value must not leak into the log.
      expect(JSON.stringify(entry.changes)).not.toContain('Bob');
    });

    it('attributes concurrent edits to the respective actors', async () => {
      const {
        event,
        user: userA,
        accessToken: tokenA,
      } = await createEventWithManagerAndToken();
      const userB = await UserFactory.create();
      await EventManagerFactory.create({
        event: { connect: { id: event.id } },
        user: { connect: { id: userB.id } },
        role: 'COORDINATOR',
      });
      const tokenB = generateAccessToken(userB);

      const registration = await createRegistration(event, {
        status: 'PENDING',
      });

      await request()
        .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
        .send({ status: 'ACCEPTED' })
        .auth(tokenA, { type: 'bearer' })
        .expect(200);

      await request()
        .patch(`/api/v1/events/${event.id}/registrations/${registration.id}`)
        .send({ status: 'WAITLISTED' })
        .auth(tokenB, { type: 'bearer' })
        .expect(200);

      const response = await fetchAudit(
        event.id,
        registration.id,
        tokenA,
      ).expect(200);

      const entries = response.body.data;
      expect(entries).toHaveLength(2);
      // newest first
      expect(entries[0].actor.id).toBe(userB.id);
      expect(entries[1].actor.id).toBe(userA.id);
    });

    it('keeps a delete event without any personal data after the registration is gone', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const registration = await createRegistration(event, {
        status: 'ACCEPTED',
        data: { first_name: 'Ann' },
      });

      await request()
        .delete(`/api/v1/events/${event.id}/registrations/${registration.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      // Registration row is gone, but the audit event survives (no FK) — and it
      // carries no snapshot, so no personal data lingers in the log.
      const logs = await prisma.auditLog.findMany({
        where: { entityType: 'registration', entityId: registration.id },
      });
      const deleteLog = logs.find((log) => log.action === 'deleted');
      expect(deleteLog).toBeDefined();
      expect(deleteLog?.changes).toBeNull();
      expect(JSON.stringify(logs)).not.toContain('Ann');
    });

    it.each([
      { role: 'VIEWER', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
    ])(
      'allows $role to view the audit trail',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } = await createEventWithManagerAndToken(
          undefined,
          role,
        );
        const registration = await createRegistration(event);

        await fetchAudit(event.id, registration.id, accessToken).expect(
          expectedStatus,
        );
      },
    );

    it('responds with 403 when the user is not an event manager', async () => {
      const accessToken = generateAccessToken(await UserFactory.create());
      const event = await EventFactory.create();
      const registration = await createRegistration(event);

      await fetchAudit(event.id, registration.id, accessToken).expect(403);
    });

    it('responds with 401 when unauthenticated', async () => {
      const event = await EventFactory.create();
      const registration = await createRegistration(event);

      await request()
        .get(
          `/api/v1/events/${event.id}/registrations/${registration.id}/audit`,
        )
        .expect(401);
    });

    it('responds with 404 when the registration does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      await fetchAudit(event.id, ulid(), accessToken).expect(404);
    });
  });

  describe('/api/v1/events/:eventId/audit', () => {
    const fetchEventAudit = (
      eventId: string,
      token: string,
      query: Record<string, string> = {},
    ) =>
      request()
        .get(`/api/v1/events/${eventId}/audit`)
        .query(query)
        .auth(token, { type: 'bearer' });

    const createLog = (
      eventId: string,
      data: Partial<Prisma.AuditLogUncheckedCreateInput> = {},
    ) =>
      prisma.auditLog.create({
        data: {
          action: 'updated',
          entityType: 'registration',
          entityId: ulid(),
          eventId,
          createdAt: new Date(),
          ...data,
        },
      });

    it('paginates newest-first with a cursor and a total on the first page', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const now = Date.now();
      const logs = await Promise.all(
        [0, 1, 2].map((i) =>
          createLog(event.id, { createdAt: new Date(now + i * 1000) }),
        ),
      );

      const first = await fetchEventAudit(event.id, accessToken, {
        limit: '2',
      }).expect(200);

      expect(first.body.data).toHaveLength(2);
      expect(first.body.data[0].id).toBe(logs[2].id);
      expect(first.body.data[1].id).toBe(logs[1].id);
      expect(first.body.meta.total).toBe(3);
      expect(first.body.meta.nextCursor).toBe(logs[1].id);

      const second = await fetchEventAudit(event.id, accessToken, {
        limit: '2',
        cursor: first.body.meta.nextCursor,
      }).expect(200);

      expect(second.body.data).toHaveLength(1);
      expect(second.body.data[0].id).toBe(logs[0].id);
      expect(second.body.meta.nextCursor).toBeNull();
      expect(second.body.meta.total).toBeUndefined();
    });

    it('narrows by entityType', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const registrationLog = await createLog(event.id, {
        entityType: 'registration',
      });
      await createLog(event.id, { entityType: 'message' });

      const response = await fetchEventAudit(event.id, accessToken, {
        entityType: 'registration',
      }).expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(registrationLog.id);
    });

    it('narrows by entityId', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const entityId = ulid();
      const targetLog = await createLog(event.id, { entityId });
      await createLog(event.id, {});

      const response = await fetchEventAudit(event.id, accessToken, {
        entityId,
      }).expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(targetLog.id);
    });

    it('narrows by actorId', async () => {
      const { event, accessToken, user } =
        await createEventWithManagerAndToken();
      const actorLog = await createLog(event.id, { actorId: user.id });
      await createLog(event.id, { actorId: null });

      const response = await fetchEventAudit(event.id, accessToken, {
        actorId: user.id,
      }).expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(actorLog.id);
    });

    it('excludes system (actor-less) entries when hideSystem is set', async () => {
      const { event, accessToken, user } =
        await createEventWithManagerAndToken();
      const actorLog = await createLog(event.id, { actorId: user.id });
      await createLog(event.id, { actorId: null });

      const response = await fetchEventAudit(event.id, accessToken, {
        hideSystem: 'true',
      }).expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(actorLog.id);
    });

    it('narrows by a from/to date range', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const inRange = await createLog(event.id, {
        createdAt: moment('2024-06-15').toDate(),
      });
      await createLog(event.id, { createdAt: moment('2024-01-01').toDate() });
      await createLog(event.id, { createdAt: moment('2024-12-31').toDate() });

      const response = await fetchEventAudit(event.id, accessToken, {
        from: moment('2024-06-01').toISOString(),
        to: moment('2024-06-30').toISOString(),
      }).expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(inRange.id);
    });

    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 403 },
      { role: 'COUNSELOR', expectedStatus: 403 },
    ])(
      '$role gets $expectedStatus for the event-wide audit log',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } = await createEventWithManagerAndToken(
          undefined,
          role,
        );

        await fetchEventAudit(event.id, accessToken).expect(expectedStatus);
      },
    );

    it('responds with 401 when unauthenticated', async () => {
      const event = await EventFactory.create();

      await request().get(`/api/v1/events/${event.id}/audit`).expect(401);
    });
  });

  describe('retention jobs', () => {
    const createAuditLog = (
      data: Partial<Prisma.AuditLogUncheckedCreateInput> = {},
    ) =>
      prisma.auditLog.create({
        data: {
          action: 'updated',
          entityType: 'registration',
          entityId: ulid(),
          ...data,
        },
      });

    describe('purgeExpiredAuditLogs', () => {
      it('deletes orphaned entries past the retention window', async () => {
        const expired = await createAuditLog({
          eventId: null,
          createdAt: moment().subtract(3, 'years').toDate(),
        });

        await resolve(AuditService).purgeExpiredAuditLogs();

        expect(
          await prisma.auditLog.findUnique({ where: { id: expired.id } }),
        ).toBeNull();
      });

      it('keeps orphaned entries within the retention window', async () => {
        const recent = await createAuditLog({
          eventId: null,
          createdAt: moment().subtract(1, 'day').toDate(),
        });

        await resolve(AuditService).purgeExpiredAuditLogs();

        expect(
          await prisma.auditLog.findUnique({ where: { id: recent.id } }),
        ).not.toBeNull();
      });

      it('keeps entries still tied to an event regardless of age', async () => {
        const old = await createAuditLog({
          eventId: ulid(),
          createdAt: moment().subtract(3, 'years').toDate(),
        });

        await resolve(AuditService).purgeExpiredAuditLogs();

        expect(
          await prisma.auditLog.findUnique({ where: { id: old.id } }),
        ).not.toBeNull();
      });
    });
  });
});
