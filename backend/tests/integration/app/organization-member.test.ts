import { describe, expect, it } from 'vitest';
import {
  OrganizationFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import type { OrganizationRole } from '@camp-registration/common/permissions';

const url = (organizationId: string) =>
  `/api/v1/organizations/${organizationId}/members`;

const createOrganizationWithRole = async (role: OrganizationRole) => {
  const user = await UserFactory.create();
  const accessToken = generateAccessToken(user);
  const organization = await OrganizationFactory.create({
    members: { create: { userId: user.id, role } },
  });

  return { user, accessToken, organization };
};

describe('organization members', () => {
  describe('GET', () => {
    it.each(['ADMIN', 'MEMBER'] as const)(
      'should respond with `200` for a %s',
      async (role) => {
        const { accessToken, organization } =
          await createOrganizationWithRole(role);

        const { body } = await request()
          .get(url(organization.id))
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body.data).toHaveLength(1);
      },
    );

    it('should respond with `403` for a non-member', async () => {
      const outsider = await UserFactory.create();
      const accessToken = generateAccessToken(outsider);
      const organization = await OrganizationFactory.create();

      await request()
        .get(url(organization.id))
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });
  });

  describe('POST', () => {
    it('should add an existing user as an accepted member', async () => {
      const { accessToken, organization } =
        await createOrganizationWithRole('ADMIN');
      const invitee = await UserFactory.create({
        email: 'invitee@example.com',
      });

      const { body } = await request()
        .post(url(organization.id))
        .send({ email: invitee.email, role: 'MEMBER' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data.status).toBe('ACCEPTED');
      expect(body.data.role).toBe('MEMBER');
      expect(body.data.email).toBe(invitee.email);
    });

    it('should invite an unknown email as a pending member', async () => {
      const { accessToken, organization } =
        await createOrganizationWithRole('ADMIN');

      const { body } = await request()
        .post(url(organization.id))
        .send({ email: 'nobody@example.com', role: 'MEMBER' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data.status).toBe('PENDING');
      expect(body.data.email).toBe('nobody@example.com');

      const member = await prisma.organizationMember.findUnique({
        where: { id: body.data.id },
      });
      expect(member?.userId).toBeNull();
    });

    it('should respond with `409` when the person is already a member', async () => {
      const { accessToken, organization, user } =
        await createOrganizationWithRole('ADMIN');

      await request()
        .post(url(organization.id))
        .send({ email: user.email, role: 'MEMBER' })
        .auth(accessToken, { type: 'bearer' })
        .expect(409);
    });

    it('should respond with `409` for a duplicate pending invitation', async () => {
      const { accessToken, organization } =
        await createOrganizationWithRole('ADMIN');

      await request()
        .post(url(organization.id))
        .send({ email: 'nobody@example.com', role: 'MEMBER' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      await request()
        .post(url(organization.id))
        .send({ email: 'nobody@example.com', role: 'ADMIN' })
        .auth(accessToken, { type: 'bearer' })
        .expect(409);
    });

    it('should respond with `403` for a member', async () => {
      const { accessToken, organization } =
        await createOrganizationWithRole('MEMBER');

      await request()
        .post(url(organization.id))
        .send({ email: 'nobody@example.com', role: 'MEMBER' })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });
  });

  describe('PATCH', () => {
    it('should respond with `200` and change the role', async () => {
      const { accessToken, organization } =
        await createOrganizationWithRole('ADMIN');
      const other = await UserFactory.create();
      const member = await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: other.id,
          role: 'MEMBER',
        },
      });

      const { body } = await request()
        .patch(`${url(organization.id)}/${member.id}`)
        .send({ role: 'ADMIN' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.role).toBe('ADMIN');
    });

    it('should respond with `409` when demoting the last administrator', async () => {
      const { accessToken, organization, user } =
        await createOrganizationWithRole('ADMIN');
      const member = await prisma.organizationMember.findFirstOrThrow({
        where: { organizationId: organization.id, userId: user.id },
      });

      await request()
        .patch(`${url(organization.id)}/${member.id}`)
        .send({ role: 'MEMBER' })
        .auth(accessToken, { type: 'bearer' })
        .expect(409);
    });

    it('should allow demotion when another administrator remains', async () => {
      const { accessToken, organization, user } =
        await createOrganizationWithRole('ADMIN');
      const other = await UserFactory.create();
      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: other.id,
          role: 'ADMIN',
        },
      });
      const member = await prisma.organizationMember.findFirstOrThrow({
        where: { organizationId: organization.id, userId: user.id },
      });

      await request()
        .patch(`${url(organization.id)}/${member.id}`)
        .send({ role: 'MEMBER' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
    });
  });

  describe('DELETE', () => {
    it('should respond with `409` when removing the last administrator', async () => {
      const { accessToken, organization, user } =
        await createOrganizationWithRole('ADMIN');
      const member = await prisma.organizationMember.findFirstOrThrow({
        where: { organizationId: organization.id, userId: user.id },
      });

      await request()
        .delete(`${url(organization.id)}/${member.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(409);
    });

    it('should let a member leave the organization', async () => {
      const { organization } = await createOrganizationWithRole('ADMIN');
      const other = await UserFactory.create();
      const otherToken = generateAccessToken(other);
      const member = await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: other.id,
          role: 'MEMBER',
        },
      });

      await request()
        .delete(`${url(organization.id)}/${member.id}`)
        .auth(otherToken, { type: 'bearer' })
        .expect(204);

      await expect(
        prisma.organizationMember.findUnique({ where: { id: member.id } }),
      ).resolves.toBeNull();
    });

    it('should respond with `403` when a member removes someone else', async () => {
      const { organization } = await createOrganizationWithRole('ADMIN');
      const other = await UserFactory.create();
      const otherToken = generateAccessToken(other);
      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: other.id,
          role: 'MEMBER',
        },
      });
      const victim = await UserFactory.create();
      const victimMember = await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: victim.id,
          role: 'MEMBER',
        },
      });

      await request()
        .delete(`${url(organization.id)}/${victimMember.id}`)
        .auth(otherToken, { type: 'bearer' })
        .expect(403);
    });
  });

  describe('invitation resolution', () => {
    it('should bind a pending invitation when the invitee registers', async () => {
      const { accessToken, organization } =
        await createOrganizationWithRole('ADMIN');

      const { body } = await request()
        .post(url(organization.id))
        .send({ email: 'newcomer@example.com', role: 'MEMBER' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      await request()
        .post('/api/v1/auth/register')
        .send({
          name: 'Newcomer',
          email: 'newcomer@example.com',
          password: 'Password1!',
        })
        .expect(201);

      const member = await prisma.organizationMember.findUniqueOrThrow({
        where: { id: body.data.id },
      });
      expect(member.userId).not.toBeNull();

      await expect(
        prisma.organizationInvitation.findFirst({
          where: { email: 'newcomer@example.com' },
        }),
      ).resolves.toBeNull();
    });
  });
});
