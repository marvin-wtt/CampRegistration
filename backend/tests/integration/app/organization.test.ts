import { describe, expect, it, vi } from 'vitest';
import { NoOpMailer } from '#app/mail/noop.mailer';
import {
  CampFactory,
  OrganizationFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { ulid } from 'ulidx';
import type { OrganizationRole } from '@camp-registration/common/permissions';
import type { OrganizationVerificationStatus } from '@camp-registration/common/entities';

const BASE = '/api/v1/organizations';

const validBody = () => ({
  name: 'Youth Adventures',
  contactEmail: 'contact@example.com',
  country: 'de',
  addressStreet: 'Example Street 1',
  addressZipCode: '10115',
  addressCity: 'Berlin',
  registrationNumber: 'VR123456',
});

const createOrganizationWithRole = async (
  role: OrganizationRole,
  verificationStatus: OrganizationVerificationStatus = 'VERIFIED',
) => {
  const user = await UserFactory.create();
  const accessToken = generateAccessToken(user);
  const organization = await OrganizationFactory.create({
    verificationStatus,
    members: { create: { userId: user.id, role } },
  });

  return { user, accessToken, organization };
};

describe(BASE, () => {
  describe(`GET ${BASE}`, () => {
    it('should respond with `200` and only the organizations the user belongs to', async () => {
      const { accessToken, organization } =
        await createOrganizationWithRole('ADMIN');
      await OrganizationFactory.create();

      const { body } = await request()
        .get(BASE)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe(organization.id);
    });

    it('should respond with `403` when a regular user requests view=all', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .get(`${BASE}?view=all`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `200` and every organization for an administrator', async () => {
      const user = await UserFactory.create({ role: 'ADMIN' });
      const accessToken = generateAccessToken(user);
      await OrganizationFactory.create();
      await OrganizationFactory.create();

      const { body } = await request()
        .get(`${BASE}?view=all`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toHaveLength(2);
    });

    it('should filter the moderation queue by status', async () => {
      const user = await UserFactory.create({ role: 'ADMIN' });
      const accessToken = generateAccessToken(user);
      const pending = await OrganizationFactory.create({
        verificationStatus: 'PENDING',
      });
      await OrganizationFactory.create({ verificationStatus: 'VERIFIED' });

      const { body } = await request()
        .get(`${BASE}?view=all&status=PENDING`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe(pending.id);
    });
  });

  describe(`POST ${BASE}`, () => {
    it('should respond with `201`, start PENDING and make the creator an admin', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      const { body } = await request()
        .post(BASE)
        .send(validBody())
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data.verificationStatus).toBe('PENDING');

      const member = await prisma.organizationMember.findFirst({
        where: { organizationId: body.data.id, userId: user.id },
      });
      expect(member?.role).toBe('ADMIN');
    });

    it('should respond with `401` when unauthenticated', async () => {
      await request().post(BASE).send(validBody()).expect(401);
    });

    it('should respond with `201` without a registration number', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      const { body: response } = await request()
        .post(BASE)
        .send({ ...validBody(), registrationNumber: null })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(response.data.registrationNumber).toBeNull();
    });

    it.each([
      ['name', { name: '' }],
      ['contactEmail', { contactEmail: 'not-an-email' }],
      ['country', { country: 'deu' }],
    ])('should respond with `400` for an invalid %s', async (_field, patch) => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .post(BASE)
        .send({ ...validBody(), ...patch })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });
  });

  describe(`GET ${BASE}/:organizationId`, () => {
    it.each(['ADMIN', 'MEMBER'] as const)(
      'should respond with `200` for a %s',
      async (role) => {
        const { accessToken, organization } =
          await createOrganizationWithRole(role);

        const { body } = await request()
          .get(`${BASE}/${organization.id}`)
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body.data.id).toBe(organization.id);
        expect(body.data.ownedCamps).toBe(0);
        expect(body.data.ownedNewsletters).toBe(0);
      },
    );

    it('should report what the organization owns', async () => {
      const { accessToken, organization } =
        await createOrganizationWithRole('ADMIN');
      await CampFactory.create({
        organization: { connect: { id: organization.id } },
      });
      await CampFactory.create({
        organization: { connect: { id: organization.id } },
      });

      const { body } = await request()
        .get(`${BASE}/${organization.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.ownedCamps).toBe(2);
      expect(body.data.ownedNewsletters).toBe(0);
    });

    it('should respond with `403` for a non-member', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);
      const organization = await OrganizationFactory.create();

      await request()
        .get(`${BASE}/${organization.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `404` for an unknown organization', async () => {
      const user = await UserFactory.create({ role: 'ADMIN' });
      const accessToken = generateAccessToken(user);

      await request()
        .get(`${BASE}/${ulid()}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe(`PATCH ${BASE}/:organizationId`, () => {
    it('should respond with `200` for an admin', async () => {
      const { accessToken, organization } = await createOrganizationWithRole(
        'ADMIN',
        'VERIFIED',
      );

      const { body } = await request()
        .patch(`${BASE}/${organization.id}`)
        .send({ name: 'Renamed' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.name).toBe('Renamed');
    });

    it('should respond with `403` for a member', async () => {
      const { accessToken, organization } =
        await createOrganizationWithRole('MEMBER');

      await request()
        .patch(`${BASE}/${organization.id}`)
        .send({ name: 'Renamed' })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should allow editing while awaiting verification', async () => {
      // No lock: the demotion below already re-opens review, so blocking would
      // only freeze the organization after its first edit.
      const { accessToken, organization } = await createOrganizationWithRole(
        'ADMIN',
        'PENDING',
      );

      await request()
        .patch(`${BASE}/${organization.id}`)
        .send({ name: 'Renamed' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
    });

    it('should demote a verified organization when the legal identity changes', async () => {
      const { accessToken, organization } = await createOrganizationWithRole(
        'ADMIN',
        'VERIFIED',
      );

      const { body } = await request()
        .patch(`${BASE}/${organization.id}`)
        .send({ registrationNumber: 'NEW-12345' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.verificationStatus).toBe('PENDING');
      expect(body.data.reviewedAt).toBeNull();
    });

    it.each([
      ['contactEmail', 'new@example.com'],
      ['phone', '+49 30 999999'],
      ['website', 'https://changed.example.com'],
    ])(
      'should keep the organization verified when only %s changes',
      async (field, value) => {
        // Contact details were not what was vetted; changing them must not pull
        // the organization's camps out of the public directory.
        const { accessToken, organization } = await createOrganizationWithRole(
          'ADMIN',
          'VERIFIED',
        );

        const { body } = await request()
          .patch(`${BASE}/${organization.id}`)
          .send({ [field]: value })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body.data.verificationStatus).toBe('VERIFIED');
      },
    );

    it('should keep the organization verified when a field is resubmitted unchanged', async () => {
      const { accessToken, organization } = await createOrganizationWithRole(
        'ADMIN',
        'VERIFIED',
      );

      const { body } = await request()
        .patch(`${BASE}/${organization.id}`)
        .send({ name: organization.name })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.verificationStatus).toBe('VERIFIED');
    });

    it('should leave camps published when demoting', async () => {
      // A demotion is not a rejection: the registration guard and public
      // listing already exclude unverified organizations, so the camps simply
      // reappear once it is verified again.
      const { accessToken, organization } = await createOrganizationWithRole(
        'ADMIN',
        'VERIFIED',
      );
      const camp = await CampFactory.create({
        listed: true,
        organization: { connect: { id: organization.id } },
      });

      await request()
        .patch(`${BASE}/${organization.id}`)
        .send({ addressCity: 'Elsewhere' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const updated = await prisma.camp.findUnique({ where: { id: camp.id } });
      expect(updated?.listed).toBe(true);
    });
  });

  describe(`DELETE ${BASE}/:organizationId`, () => {
    it('should respond with `204` when the organization owns nothing', async () => {
      const { accessToken, organization } =
        await createOrganizationWithRole('ADMIN');

      await request()
        .delete(`${BASE}/${organization.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      await expect(
        prisma.organization.findUnique({ where: { id: organization.id } }),
      ).resolves.toBeNull();
    });

    it('should respond with `409` while it still owns a camp', async () => {
      const { accessToken, organization } =
        await createOrganizationWithRole('ADMIN');
      await CampFactory.create({
        organization: { connect: { id: organization.id } },
      });

      await request()
        .delete(`${BASE}/${organization.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(409);

      await expect(
        prisma.organization.findUnique({ where: { id: organization.id } }),
      ).resolves.not.toBeNull();
    });
  });

  describe('review notifications', () => {
    const mailer = NoOpMailer.prototype;

    it('should notify administrators when an organization is submitted', async () => {
      await UserFactory.create({ role: 'ADMIN', email: 'mod1@example.com' });
      await UserFactory.create({ role: 'ADMIN', email: 'mod2@example.com' });
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .post(BASE)
        .send(validBody())
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      // One per moderator, so each sees it in their own inbox and language.
      const recipients = vi
        .mocked(mailer.sendMail)
        .mock.calls.map((call) => call[0].to);
      expect(recipients).toHaveLength(2);
      expect(JSON.stringify(recipients)).toContain('mod1@example.com');
      expect(JSON.stringify(recipients)).toContain('mod2@example.com');
    });

    it('should not notify anyone when there are no administrators', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .post(BASE)
        .send(validBody())
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(mailer.sendMail).not.toHaveBeenCalled();
    });

    it('should notify the organizations administrators of the outcome', async () => {
      const admin = await UserFactory.create({ role: 'ADMIN' });
      const accessToken = generateAccessToken(admin);
      const owner = await UserFactory.create({ email: 'owner@example.com' });
      const organization = await OrganizationFactory.create({
        verificationStatus: 'PENDING',
        members: { create: { userId: owner.id, role: 'ADMIN' } },
      });

      await request()
        .patch(`${BASE}/${organization.id}/verification`)
        .send({ status: 'VERIFIED' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(mailer.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.objectContaining({ address: 'owner@example.com' }),
        }),
      );
    });

    it('should include the reason when rejecting', async () => {
      const admin = await UserFactory.create({ role: 'ADMIN' });
      const accessToken = generateAccessToken(admin);
      const owner = await UserFactory.create({ email: 'owner@example.com' });
      const organization = await OrganizationFactory.create({
        verificationStatus: 'PENDING',
        members: { create: { userId: owner.id, role: 'ADMIN' } },
      });

      await request()
        .patch(`${BASE}/${organization.id}/verification`)
        .send({
          status: 'REJECTED',
          reviewNote: 'Registration number invalid.',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(mailer.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('Registration number invalid.'),
        }),
      );
    });

    it('should not notify members who never accepted their invitation', async () => {
      const admin = await UserFactory.create({ role: 'ADMIN' });
      const accessToken = generateAccessToken(admin);
      const organization = await OrganizationFactory.create({
        verificationStatus: 'PENDING',
        invitations: { create: { email: 'invited@example.com' } },
      });

      await request()
        .patch(`${BASE}/${organization.id}/verification`)
        .send({ status: 'VERIFIED' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(mailer.sendMail).not.toHaveBeenCalled();
    });
  });

  describe(`GET ${BASE}/:organizationId/camps`, () => {
    it('should respond with `200` and only the organizations own camps', async () => {
      const { accessToken, organization } =
        await createOrganizationWithRole('ADMIN');
      const camp = await CampFactory.create({
        organization: { connect: { id: organization.id } },
      });
      // Belongs to a different organization created by the factory.
      await CampFactory.create();

      const { body } = await request()
        .get(`${BASE}/${organization.id}/camps`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe(camp.id);
    });

    it('should include private camps of the organization', async () => {
      const { accessToken, organization } =
        await createOrganizationWithRole('ADMIN');
      await CampFactory.create({
        listed: false,
        organization: { connect: { id: organization.id } },
      });

      const { body } = await request()
        .get(`${BASE}/${organization.id}/camps`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toHaveLength(1);
    });

    it('should respond with `403` for a member', async () => {
      // MEMBER may create camps but not survey the organization's portfolio.
      const { accessToken, organization } =
        await createOrganizationWithRole('MEMBER');

      await request()
        .get(`${BASE}/${organization.id}/camps`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `403` for a non-member', async () => {
      const outsider = await UserFactory.create();
      const accessToken = generateAccessToken(outsider);
      const organization = await OrganizationFactory.create();

      await request()
        .get(`${BASE}/${organization.id}/camps`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const organization = await OrganizationFactory.create();

      await request().get(`${BASE}/${organization.id}/camps`).expect(401);
    });
  });

  describe(`PATCH ${BASE}/:organizationId/verification`, () => {
    it('should respond with `200` and verify the organization', async () => {
      const admin = await UserFactory.create({ role: 'ADMIN' });
      const accessToken = generateAccessToken(admin);
      const organization = await OrganizationFactory.create({
        verificationStatus: 'PENDING',
      });

      const { body } = await request()
        .patch(`${BASE}/${organization.id}/verification`)
        .send({ status: 'VERIFIED' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.verificationStatus).toBe('VERIFIED');
      expect(body.data.reviewedAt).not.toBeNull();
    });

    it('should unpublish the organizations camps on rejection', async () => {
      const admin = await UserFactory.create({ role: 'ADMIN' });
      const accessToken = generateAccessToken(admin);
      const organization = await OrganizationFactory.create({
        verificationStatus: 'PENDING',
      });
      const camp = await CampFactory.create({
        listed: true,
        organization: { connect: { id: organization.id } },
      });

      await request()
        .patch(`${BASE}/${organization.id}/verification`)
        .send({ status: 'REJECTED', reviewNote: 'Could not verify.' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const updated = await prisma.camp.findUnique({ where: { id: camp.id } });
      expect(updated?.listed).toBe(false);
    });

    it('should respond with `403` for the organizations own admin', async () => {
      const { accessToken, organization } = await createOrganizationWithRole(
        'ADMIN',
        'PENDING',
      );

      await request()
        .patch(`${BASE}/${organization.id}/verification`)
        .send({ status: 'VERIFIED' })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should revoke a previously verified organization', async () => {
      // A verified organization can turn out to be fraudulent; the decision has
      // to be reversible after the fact.
      const admin = await UserFactory.create({ role: 'ADMIN' });
      const accessToken = generateAccessToken(admin);
      const organization = await OrganizationFactory.create({
        verificationStatus: 'VERIFIED',
      });
      const camp = await CampFactory.create({
        listed: true,
        organization: { connect: { id: organization.id } },
      });

      const { body } = await request()
        .patch(`${BASE}/${organization.id}/verification`)
        .send({ status: 'REJECTED', reviewNote: 'Registration was falsified.' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.verificationStatus).toBe('REJECTED');

      // Revoking must unpublish just as a first-time rejection does.
      const updated = await prisma.camp.findUnique({ where: { id: camp.id } });
      expect(updated?.listed).toBe(false);
    });

    it('should reinstate a previously rejected organization', async () => {
      const admin = await UserFactory.create({ role: 'ADMIN' });
      const accessToken = generateAccessToken(admin);
      const organization = await OrganizationFactory.create({
        verificationStatus: 'REJECTED',
        reviewNote: 'Could not verify.',
      });

      const { body } = await request()
        .patch(`${BASE}/${organization.id}/verification`)
        .send({ status: 'VERIFIED' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.verificationStatus).toBe('VERIFIED');
      expect(body.data.reviewNote).toBeNull();
    });

    it('should not republish camps when reinstating', async () => {
      // Unpublishing was a safety action; putting a camp back in front of the
      // public is the organization's decision to make, not the reviewer's.
      const admin = await UserFactory.create({ role: 'ADMIN' });
      const accessToken = generateAccessToken(admin);
      const organization = await OrganizationFactory.create({
        verificationStatus: 'REJECTED',
      });
      const camp = await CampFactory.create({
        listed: false,
        organization: { connect: { id: organization.id } },
      });

      await request()
        .patch(`${BASE}/${organization.id}/verification`)
        .send({ status: 'VERIFIED' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const updated = await prisma.camp.findUnique({ where: { id: camp.id } });
      expect(updated?.listed).toBe(false);
    });
  });

  describe(`POST ${BASE}/:organizationId/verification`, () => {
    it('should respond with `200` and requeue a rejected organization', async () => {
      const { accessToken, organization } = await createOrganizationWithRole(
        'ADMIN',
        'REJECTED',
      );

      const { body } = await request()
        .post(`${BASE}/${organization.id}/verification`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.verificationStatus).toBe('PENDING');
      expect(body.data.reviewNote).toBeNull();
    });

    it('should respond with `409` when the organization was not rejected', async () => {
      const { accessToken, organization } = await createOrganizationWithRole(
        'ADMIN',
        'PENDING',
      );

      await request()
        .post(`${BASE}/${organization.id}/verification`)
        .auth(accessToken, { type: 'bearer' })
        .expect(409);
    });
  });
});
