import { describe, expect, it } from 'vitest';
import { UserFactory } from '../../prisma/factories';
import { request } from '../utils/request';
import prisma from '../utils/prisma';
import { generateAccessToken } from '../utils/token';
import { ulid } from 'ulidx';

describe('/api/v1/users/', () => {
  const createAdminWithToken = async () => {
    const user = await UserFactory.create({
      role: 'ADMIN',
    });
    const accessToken = generateAccessToken(user);

    return {
      user,
      accessToken,
    };
  };

  const createUserWithToken = async () => {
    const user = await UserFactory.create({
      role: 'USER',
    });
    const accessToken = generateAccessToken(user);

    return {
      user,
      accessToken,
    };
  };

  describe('GET /api/v1/users', () => {
    it('should respond with `200` status code when user is not admin', async () => {
      const { accessToken } = await createAdminWithToken();
      await UserFactory.create();
      await UserFactory.create();

      const { body } = await request()
        .get(`/api/v1/users/`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.length).toBe(3);
    });

    it('should respond with `403` status code when user is not admin', async () => {
      const { accessToken } = await createUserWithToken();

      await request()
        .get(`/api/v1/users/`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      await request().get(`/api/v1/users/`).send().expect(401);
    });
  });

  describe('GET /api/v1/users/:userId', () => {
    it('should respond with `200` status code when user is admin', async () => {
      const { accessToken } = await createAdminWithToken();
      const user = await UserFactory.create();

      const { body } = await request()
        .get(`/api/v1/users/${user.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toStrictEqual({
        id: user.id,
        name: user.name,
        email: user.email,
        locale: user.locale,
        role: user.role,
        locked: user.locked,
        emailVerified: user.emailVerified,
        lastSeen: null,
        createdAt: expect.anything(),
      });
    });

    it('should respond with `403` status code when user is not admin', async () => {
      const { accessToken } = await createUserWithToken();
      const user = await UserFactory.create();

      await request()
        .get(`/api/v1/users/${user.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const user = await UserFactory.create();

      await request().get(`/api/v1/users/${user.id}`).send().expect(401);
    });

    it('should respond with `404` status code when camp id does not exists', async () => {
      const { accessToken } = await createAdminWithToken();
      const campId = ulid();

      await request()
        .delete(`/api/v1/users/${campId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('POST /api/v1/users/:userId', () => {
    it('should respond with `200` status code when user is admin', async () => {
      const { accessToken } = await createAdminWithToken();

      const { body } = await request()
        .post(`/api/v1/users/`)
        .send({
          name: 'NewName',
          email: 'test@email.com',
          password: 'Password1',
          locale: 'en-US',
          role: 'USER',
          locked: false,
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data).toStrictEqual({
        id: expect.anything(),
        name: 'NewName',
        email: 'test@email.com',
        locale: 'en-US',
        role: 'USER',
        locked: false,
        emailVerified: false,
        lastSeen: null,
        createdAt: expect.anything(),
      });
    });

    it.todo('should respond with `400` status code when data is invalid');

    it('should respond with `403` status code when user is not admin', async () => {
      const { accessToken } = await createUserWithToken();

      await request()
        .post(`/api/v1/users/`)
        .send({
          name: 'NewName',
          email: 'test@email.com',
          password: 'Password1',
          locale: 'en-US',
          role: 'USER',
          locked: false,
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      await request()
        .post(`/api/v1/users/`)
        .send({
          name: 'NewName',
          email: 'test@email.com',
          password: 'Password1',
          locale: 'en-US',
          role: 'USER',
          locked: false,
        })
        .expect(401);
    });
  });

  describe('PATCH /api/v1/users/:userId', () => {
    describe('should respond with `200` status code when updating properties', () => {
      it('should update the name', async () => {
        const { accessToken } = await createAdminWithToken();
        const user = await UserFactory.create();

        const { body } = await request()
          .patch(`/api/v1/users/${user.id}`)
          .send({
            name: 'New name',
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body.data.name).toBe('New name');
      });

      it('should update the email', async () => {
        const { accessToken } = await createAdminWithToken();
        const user = await UserFactory.create();

        const { body } = await request()
          .patch(`/api/v1/users/${user.id}`)
          .send({
            email: 'test@email.com',
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body.data.email).toBe('test@email.com');
      });

      it('should update the locale', async () => {
        const { accessToken } = await createAdminWithToken();
        const user = await UserFactory.create();

        const { body } = await request()
          .patch(`/api/v1/users/${user.id}`)
          .send({
            locale: 'en-US',
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);

        expect(body.data.locale).toBe('en-US');
      });

      it('should update the locale', async () => {
        const { accessToken } = await createAdminWithToken();
        const user = await UserFactory.create();

        const { body } = await request()
          .patch(`/api/v1/users/${user.id}`)
          .send({
            password: 'Password123',
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(200);
      });
    });

    it('should respond with `200` status code when email remains the same', async () => {
      const { accessToken } = await createAdminWithToken();
      const user = await UserFactory.create({
        email: 'test@email.com',
      });

      await request()
        .patch(`/api/v1/users/${user.id}`)
        .send({
          email: 'test@email.com',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
    });

    it('should respond with `400` status code when email is already used', async () => {
      const { accessToken } = await createAdminWithToken();
      const user = await UserFactory.create();
      await UserFactory.create({
        email: 'test@email.com',
      });

      await request()
        .patch(`/api/v1/users/${user.id}`)
        .send({
          email: 'test@email.com',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it.todo('should respond with `400` status code when data is invalid');

    it('should respond with `403` status code when user is not admin', async () => {
      const { accessToken } = await createUserWithToken();
      const user = await UserFactory.create();

      await request()
        .patch(`/api/v1/users/${user.id}`)
        .send({
          name: 'NewName',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const user = await UserFactory.create();

      await request()
        .patch(`/api/v1/users/${user.id}`)
        .send({
          name: 'NewName',
        })
        .expect(401);
    });

    it('should respond with `404` status code when camp id does not exists', async () => {
      const { accessToken } = await createAdminWithToken();
      const campId = ulid();

      await request()
        .patch(`/api/v1/users/${campId}`)
        .send({
          name: 'NewName',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/users/:userId', () => {
    it('should respond with `204` status code when user is admin', async () => {
      const { accessToken, user: adminUser } = await createAdminWithToken();
      const user = await UserFactory.create();

      await request()
        .delete(`/api/v1/users/${user.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      const userCount = await prisma.user.count();
      expect(userCount).toBe(1);

      const remainingUser = await prisma.user.findFirst();
      expect(remainingUser?.id).toBe(adminUser.id);
    });

    it('should respond with `403` status code when user is not admin', async () => {
      const { accessToken } = await createUserWithToken();
      const user = await UserFactory.create();

      await request()
        .delete(`/api/v1/users/${user.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const userCount = await prisma.user.count();
      expect(userCount).toBe(2);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const user = await UserFactory.create();

      await request().delete(`/api/v1/users/${user.id}`).send().expect(401);

      const campCount = await prisma.user.count();
      expect(campCount).toBe(1);
    });

    it('should respond with `404` status code when camp id does not exists', async () => {
      const { accessToken } = await createAdminWithToken();
      const campId = ulid();

      await request()
        .delete(`/api/v1/users/${campId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });
});
