import { describe, expect, it } from 'vitest';
import prisma from '../utils/prisma.js';
import { generateAccessToken } from './utils/token.js';
import {
  CampFactory,
  RegistrationFactory,
  UserFactory,
  CampManagerFactory,
} from '../../../prisma/factories/index.js';
import { type Camp, type Prisma } from '#generated/prisma/client.js';
import { ulid } from 'ulidx';
import { request } from '../utils/request.js';

describe('/api/v1/camps/:campId/registrations/:registrationId/audit', () => {
  const createCampWithManagerAndToken = async (
    campData: Partial<Prisma.CampCreateInput> = {},
    role = 'DIRECTOR',
  ) => {
    const camp = await CampFactory.create(campData);
    const user = await UserFactory.create();
    const manager = await CampManagerFactory.create({
      camp: { connect: { id: camp.id } },
      user: { connect: { id: user.id } },
      role,
    });
    const accessToken = generateAccessToken(user);

    return { camp, user, manager, accessToken };
  };

  const createRegistration = async (
    camp: Camp,
    data?: Partial<Prisma.RegistrationCreateInput>,
  ) => {
    return RegistrationFactory.create({
      ...data,
      camp: { connect: { id: camp.id } },
    });
  };

  const fetchAudit = (campId: string, registrationId: string, token: string) =>
    request()
      .get(`/api/v1/camps/${campId}/registrations/${registrationId}/audit`)
      .auth(token, { type: 'bearer' });

  describe('GET .../audit', () => {
    it('records a status change with actor and changed field names only', async () => {
      const { camp, user, accessToken } = await createCampWithManagerAndToken();
      const registration = await createRegistration(camp, {
        status: 'PENDING',
      });

      await request()
        .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
        .send({ status: 'ACCEPTED' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const response = await fetchAudit(
        camp.id,
        registration.id,
        accessToken,
      ).expect(200);

      const entries = response.body.data;
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        action: 'updated',
        entityType: 'registration',
        entityId: registration.id,
        campId: camp.id,
        actor: { id: user.id, name: user.name },
      });
      // Status is a bounded, non-PII field — its new value is recorded so the
      // timeline can show the outcome.
      expect(entries[0].changes.changedValues).toEqual({ status: 'ACCEPTED' });
      expect(entries[0].changes.changedFields).toBeUndefined();
    });

    it('records a data edit by changed leaf path only', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const registration = await createRegistration(camp, {
        data: { first_name: 'Ann', notes: 'x' },
      });

      await request()
        .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
        .send({ data: { first_name: 'Bob', notes: 'x' } })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const response = await fetchAudit(
        camp.id,
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
        camp,
        user: userA,
        accessToken: tokenA,
      } = await createCampWithManagerAndToken();
      const userB = await UserFactory.create();
      await CampManagerFactory.create({
        camp: { connect: { id: camp.id } },
        user: { connect: { id: userB.id } },
        role: 'COORDINATOR',
      });
      const tokenB = generateAccessToken(userB);

      const registration = await createRegistration(camp, {
        status: 'PENDING',
      });

      await request()
        .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
        .send({ status: 'ACCEPTED' })
        .auth(tokenA, { type: 'bearer' })
        .expect(200);

      await request()
        .patch(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
        .send({ status: 'WAITLISTED' })
        .auth(tokenB, { type: 'bearer' })
        .expect(200);

      const response = await fetchAudit(
        camp.id,
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
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const registration = await createRegistration(camp, {
        status: 'ACCEPTED',
        data: { first_name: 'Ann' },
      });

      await request()
        .delete(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
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
        const { camp, accessToken } = await createCampWithManagerAndToken(
          undefined,
          role,
        );
        const registration = await createRegistration(camp);

        await fetchAudit(camp.id, registration.id, accessToken).expect(
          expectedStatus,
        );
      },
    );

    it('responds with 403 when the user is not a camp manager', async () => {
      const accessToken = generateAccessToken(await UserFactory.create());
      const camp = await CampFactory.create();
      const registration = await createRegistration(camp);

      await fetchAudit(camp.id, registration.id, accessToken).expect(403);
    });

    it('responds with 401 when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const registration = await createRegistration(camp);

      await request()
        .get(`/api/v1/camps/${camp.id}/registrations/${registration.id}/audit`)
        .expect(401);
    });

    it('responds with 404 when the registration does not exist', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      await fetchAudit(camp.id, ulid(), accessToken).expect(404);
    });
  });
});
