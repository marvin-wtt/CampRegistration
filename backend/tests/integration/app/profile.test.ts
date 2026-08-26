import { describe, expect, it } from 'vitest';
import { request } from '../utils/request.js';
import {
  EventFactory,
  EventManagerFactory,
  TokenFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import prisma from '../utils/prisma.js';
import { TokenType } from '#generated/prisma/client.js';
import argon2 from 'argon2';
import { profileUpdateBody } from './fixtures/profile.fixtures.js';

describe('/api/v1/profile', () => {
  describe('GET /api/v1/profile/', () => {
    it('should respond with `201`status code', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      const { body } = await request()
        .get(`/api/v1/profile/`)
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(200);

      expect(body.data).toEqual({
        name: user.name,
        email: user.email,
        locale: user.locale,
        role: 'USER',
        twoFactorEnabled: false,
        eventAccess: [],
        newsletterAccess: [],
        organizationAccess: [],
      });
    });

    it.each([
      {
        role: 'DIRECTOR',
        expectedPermissions: [
          'event.view',
          'event.edit',
          'event.delete',
          'event.registrations.view',
          'event.registrations.create',
          'event.registrations.edit',
          'event.registrations.delete',
          'event.managers.view',
          'event.managers.create',
          'event.managers.edit',
          'event.managers.delete',
        ],
        unexpectedPermissions: [],
      },
      {
        role: 'COORDINATOR',
        expectedPermissions: [
          'event.view',
          'event.edit',
          'event.registrations.view',
          'event.registrations.create',
          'event.registrations.edit',
          'event.registrations.delete',
          'event.managers.view',
        ],
        unexpectedPermissions: [
          'event.managers.create',
          'event.managers.edit',
          'event.managers.delete',
        ],
      },
      {
        role: 'COUNSELOR',
        expectedPermissions: [
          'event.view',
          'event.registrations.view',
          'event.registrations.create',
          'event.managers.view',
        ],
        unexpectedPermissions: [
          'event.edit',
          'event.delete',
          'event.registrations.edit',
          'event.registrations.delete',
          'event.managers.create',
          'event.managers.edit',
          'event.managers.delete',
        ],
      },
      {
        role: 'VIEWER',
        expectedPermissions: [
          'event.view',
          'event.registrations.view',
          'event.managers.view',
        ],
        unexpectedPermissions: [
          'event.edit',
          'event.delete',
          'event.registrations.create',
          'event.registrations.edit',
          'event.registrations.delete',
          'event.managers.create',
          'event.managers.edit',
          'event.managers.delete',
        ],
      },
    ])(
      'should respond with event access and permissions for $role role',
      async ({ role, expectedPermissions, unexpectedPermissions }) => {
        const user = await UserFactory.create();
        const accessToken = generateAccessToken(user);

        const event = await EventFactory.create();
        const manager = await EventManagerFactory.create({
          event: { connect: { id: event.id } },
          user: { connect: { id: user.id } },
          role,
        });

        const { body } = await request()
          .get(`/api/v1/profile/`)
          .auth(accessToken, { type: 'bearer' })
          .send()
          .expect(200);

        expect(body.data).toHaveProperty('eventAccess');
        expect(body.data.eventAccess).toHaveLength(1);
        expect(body.data.eventAccess[0]).toHaveProperty('eventId', event.id);
        expect(body.data.eventAccess[0]).toHaveProperty('role', role);
        expect(body.data.eventAccess[0]).toHaveProperty('permissions');
        expect(body.data.eventAccess[0]).toHaveProperty(
          'managerId',
          manager.id,
        );

        // Verify expected permissions
        const permissions = body.data.eventAccess[0].permissions;
        for (const permission of expectedPermissions) {
          expect(permissions).toContain(permission);
        }

        // Verify unexpected permissions
        for (const permission of unexpectedPermissions) {
          expect(permissions).not.toContain(permission);
        }
      },
    );

    it('should respond with `401` status code when and user is unauthenticated', async () => {
      await request().get(`/api/v1/profile/`).send().expect(401);
    });
  });

  describe('PATCH /api/v1/profile/', () => {
    it('should respond with `201`status code', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      const data = {
        name: 'Anton Tester',
        locale: 'en-US',
      };

      const { body } = await request()
        .patch(`/api/v1/profile/`)
        .auth(accessToken, { type: 'bearer' })
        .send(data)
        .expect(200);

      expect(body.data).toEqual({
        name: data.name,
        email: user.email,
        locale: data.locale,
        role: 'USER',
        twoFactorEnabled: false,
        eventAccess: [],
        newsletterAccess: [],
        organizationAccess: [],
      });
    });

    it('should require email verification when email changes', async () => {
      const user = await UserFactory.create({
        emailVerified: true,
        password: 'password',
      });
      const accessToken = generateAccessToken(user);

      const data = {
        email: 'test@example.com',
        currentPassword: 'password',
      };

      await request()
        .patch(`/api/v1/profile/`)
        .auth(accessToken, { type: 'bearer' })
        .send(data)
        .expect(200);

      const updatedUser = await prisma.user.findFirst({
        where: { id: user.id },
      });

      expect(updatedUser?.emailVerified).toBe(false);
    });

    it('should send the email verification email', async () => {});

    it('should not require email verification when email does not change', async () => {
      const user = await UserFactory.create({
        emailVerified: true,
      });
      const accessToken = generateAccessToken(user);

      const data = {
        name: 'Anton Tester',
      };

      await request()
        .patch(`/api/v1/profile/`)
        .auth(accessToken, { type: 'bearer' })
        .send(data)
        .expect(200);

      const updatedUser = await prisma.user.findFirst({
        where: { id: user.id },
      });

      expect(updatedUser?.emailVerified).toBe(true);
    });

    it('should logout all devices when password is updated', async () => {
      const user = await UserFactory.create({
        emailVerified: true,
        password: 'password',
      });
      const accessToken = generateAccessToken(user);

      await TokenFactory.create({
        type: TokenType.REFRESH,
        user: { connect: { id: user.id } },
      });
      await TokenFactory.create({
        type: TokenType.RESET_PASSWORD,
        user: { connect: { id: user.id } },
      });

      const data = { password: 'Password1234', currentPassword: 'password' };

      await request()
        .patch(`/api/v1/profile/`)
        .auth(accessToken, { type: 'bearer' })
        .send(data)
        .expect(200);

      const count = await prisma.token.count({
        where: {
          userId: user.id,
          blacklisted: false,
        },
      });

      expect(count).toBe(0);
    });

    it('should logout all devices when email is updated', async () => {
      const user = await UserFactory.create({
        emailVerified: true,
        password: 'password',
      });
      const accessToken = generateAccessToken(user);

      await TokenFactory.create({
        type: TokenType.REFRESH,
        user: { connect: { id: user.id } },
      });
      await TokenFactory.create({
        type: TokenType.RESET_PASSWORD,
        user: { connect: { id: user.id } },
      });

      const data = { email: 'test2@example.com', currentPassword: 'password' };

      await request()
        .patch(`/api/v1/profile/`)
        .auth(accessToken, { type: 'bearer' })
        .send(data)
        .expect(200);

      const count = await prisma.token.count({
        where: {
          userId: user.id,
          blacklisted: false,
          type: { not: 'VERIFY_EMAIL' },
        },
      });

      expect(count).toBe(0);
    });

    it('should encrypt the password', async () => {
      const user = await UserFactory.create({
        emailVerified: true,
        password: 'password',
      });
      const accessToken = generateAccessToken(user);

      const data = {
        password: 'Password1234',
        currentPassword: 'password',
      };

      await request()
        .patch(`/api/v1/profile/`)
        .auth(accessToken, { type: 'bearer' })
        .send(data)
        .expect(200);

      const updatedUser = await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
      });

      expect(updatedUser).toBeDefined();
      expect(
        await argon2.verify(updatedUser.password, data.password),
      ).toBeTruthy();
    });

    describe('request body', () => {
      it.each(profileUpdateBody)(
        'should validate the request body | $name',
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async ({ data, user: userData, expected }) => {
          const user = await UserFactory.create(userData);
          const accessToken = generateAccessToken(user);

          await request()
            .patch(`/api/v1/profile/`)
            .send(data)
            .auth(accessToken, { type: 'bearer' })
            .expect(expected);
        },
      );
    });

    it('should respond with `401` status code when user is unauthenticated', async () => {
      await request().patch(`/api/v1/profile/`).send().expect(401);
    });
  });

  describe('DELETE /api/v1/profile/', () => {
    it('should respond with `204`status code', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);
      await UserFactory.create();

      await request()
        .delete(`/api/v1/profile/`)
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(204);

      const userCount = await prisma.user.count();
      expect(userCount).toBe(1);

      const deletedUser = await prisma.user.findFirst({
        where: { email: user.email },
      });
      expect(deletedUser).toBeNull();
    });

    it('should respond with `401` status code when user is unauthenticated', async () => {
      await request().delete(`/api/v1/profile/`).send().expect(401);
    });
  });
});
