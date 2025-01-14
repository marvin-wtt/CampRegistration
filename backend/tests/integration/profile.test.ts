import { describe, expect, it } from 'vitest';
import { request } from '../utils/request';
import {
  CampFactory,
  CampManagerFactory,
  TokenFactory,
  UserFactory,
} from '../../prisma/factories';
import { generateAccessToken } from '../utils/token';
import prisma from '../utils/prisma';
import { TokenType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { profileUpdateBody } from '../fixtures/profile/profile.fixtures';

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
        camps: [],
      });
    });

    it('should respond with all camps', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      const camp = await CampFactory.create();
      await CampManagerFactory.create({
        camp: { connect: { id: camp.id } },
        user: { connect: { id: user.id } },
      });

      const { body } = await request()
        .get(`/api/v1/profile/`)
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(200);

      expect(body.data.camps).toHaveLength(1);
      expect(body.data).toHaveProperty('camps.0.id', camp.id);
    });

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
        camps: [],
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

      expect(updatedUser.emailVerified).toBe(false);
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

      expect(updatedUser.emailVerified).toBe(true);
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
        bcrypt.compareSync(data.password, updatedUser.password),
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
