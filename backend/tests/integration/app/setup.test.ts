import { describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { UserFactory } from '../../../prisma/factories/index.js';
import { request } from '../utils/request.js';
import { verifyToken } from './utils/token.js';

describe('/api/v1/setup', () => {
  describe('GET /api/v1/setup', () => {
    it('should respond with `required: true` when no users exist', async () => {
      const { body } = await request().get('/api/v1/setup').expect(200);

      expect(body).toStrictEqual({ required: true });
    });

    it('should respond with `required: true` when only non-admin users exist', async () => {
      await UserFactory.create({ role: 'USER' });

      const { body } = await request().get('/api/v1/setup').expect(200);

      expect(body).toStrictEqual({ required: true });
    });

    it('should respond with `required: false` when an admin exists', async () => {
      await UserFactory.create({ role: 'ADMIN' });

      const { body } = await request().get('/api/v1/setup').expect(200);

      expect(body).toStrictEqual({ required: false });
    });
  });

  describe('POST /api/v1/setup', () => {
    const validData = {
      name: 'Admin User',
      email: 'admin@email.net',
      password: 'Password1',
    };

    it('should respond with a `201` status code when no admin exists', async () => {
      await request().post('/api/v1/setup').send(validData).expect(201);
    });

    it('should create the user with the `ADMIN` role', async () => {
      await request().post('/api/v1/setup').send(validData).expect(201);

      const user = await prisma.user.findUnique({
        where: { email: validData.email },
      });

      expect(user?.role).toBe('ADMIN');
    });

    it('should mark the created admin email as verified', async () => {
      await request().post('/api/v1/setup').send(validData).expect(201);

      const user = await prisma.user.findUnique({
        where: { email: validData.email },
      });

      expect(user?.emailVerified).toBe(true);
    });

    it('should encode the user password', async () => {
      await request().post('/api/v1/setup').send(validData).expect(201);

      const user = await prisma.user.findUniqueOrThrow({
        where: { email: validData.email },
      });

      expect(user.password).not.toBe(validData.password);
      expect(bcrypt.compareSync(validData.password, user.password)).toBe(true);
    });

    it('should store the preferred locale of the request', async () => {
      await request()
        .post('/api/v1/setup')
        .set('Accept-Language', 'fr-CH, fr;q=0.9, en;q=0.8')
        .send(validData)
        .expect(201);

      const user = await prisma.user.findUniqueOrThrow({
        where: { email: validData.email },
      });

      expect(user.locale).toBe('fr-CH');
    });

    it('should respond with the profile and auth tokens', async () => {
      const { body } = await request()
        .post('/api/v1/setup')
        .send(validData)
        .expect(201);

      expect(body).toHaveProperty('profile.email', validData.email);
      expect(body).toHaveProperty('profile.name', validData.name);
      expect(body).toHaveProperty('tokens.access.token');
      expect(body).toHaveProperty('tokens.refresh.token');

      const tokenData = verifyToken(body.tokens.access.token);
      expect(tokenData['type']).toBe('ACCESS');
    });

    it('should set the access token as a cookie when successful', async () => {
      const { headers } = await request()
        .post('/api/v1/setup')
        .send(validData)
        .expect(201);

      expect(headers['set-cookie']).toContainEqual(
        expect.stringMatching(/^accessToken.*/),
      );
    });

    it('should ignore the role provided in the request body', async () => {
      await request()
        .post('/api/v1/setup')
        .send({ ...validData, role: 'USER' })
        .expect(201);

      const user = await prisma.user.findUniqueOrThrow({
        where: { email: validData.email },
      });

      expect(user.role).toBe('ADMIN');
    });

    it('should respond with a `403` status code when an admin already exists', async () => {
      await UserFactory.create({ role: 'ADMIN' });

      await request().post('/api/v1/setup').send(validData).expect(403);
    });

    it('should not create a second admin when one already exists', async () => {
      await UserFactory.create({
        email: 'existing@email.net',
        role: 'ADMIN',
      });

      await request().post('/api/v1/setup').send(validData).expect(403);

      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      expect(adminCount).toBe(1);

      const created = await prisma.user.findUnique({
        where: { email: validData.email },
      });
      expect(created).toBeNull();
    });

    it('should respond with a `400` status code when the email is invalid', async () => {
      await request()
        .post('/api/v1/setup')
        .send({ ...validData, email: 'not-an-email' })
        .expect(400);

      const userCount = await prisma.user.count();
      expect(userCount).toBe(0);
    });

    it('should respond with a `400` status code when the password is too weak', async () => {
      await request()
        .post('/api/v1/setup')
        .send({ ...validData, password: 'short' })
        .expect(400);

      const userCount = await prisma.user.count();
      expect(userCount).toBe(0);
    });

    it('should respond with a `400` status code when the name is missing', async () => {
      await request()
        .post('/api/v1/setup')
        .send({ email: validData.email, password: validData.password })
        .expect(400);

      const userCount = await prisma.user.count();
      expect(userCount).toBe(0);
    });

    it('should respond with a `400` status code when the email is already taken', async () => {
      // No admin yet, so setup is still open, but the email collides with an
      // existing (non-admin) account.
      await UserFactory.create({
        email: validData.email,
        role: 'USER',
      });

      await request().post('/api/v1/setup').send(validData).expect(400);

      const userCount = await prisma.user.count();
      expect(userCount).toBe(1);
    });
  });
});
