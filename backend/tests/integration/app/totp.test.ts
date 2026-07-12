import { describe, expect, it } from 'vitest';
import * as OTPAuth from 'otpauth';
import bcrypt from 'bcryptjs';
import { UserFactory } from '../../../prisma/factories/index.js';
import { User } from '#generated/prisma/client.js';
import { request } from '../utils/request.js';
import { generateAccessToken } from './utils/token.js';
import prisma from '../utils/prisma.js';

describe('/api/v1/totp/', () => {
  const generateTOTP = (user: User) => {
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.totpSecret!),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    return totp.generate();
  };

  describe('POST /api/v1/totp/setup', () => {
    it('should respond with a `200` status code', async () => {
      const user = await UserFactory.create({
        password: 'password',
      });
      const accessToken = generateAccessToken(user);

      const { body } = await request()
        .post('/api/v1/totp/setup')
        .auth(accessToken, { type: 'bearer' })
        .send({
          password: 'password',
        })
        .expect(200);

      expect(body.data).toEqual({
        url: expect.any(String),
        secret: expect.any(String),
      });

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(dbUser?.twoFactorEnabled).toBe(false);
      expect(dbUser?.totpSecret).toBe(body.data.secret);
    });

    it('should respond with a `400` status code when password does not match', async () => {
      const user = await UserFactory.create({
        password: 'password',
      });
      const accessToken = generateAccessToken(user);

      await request()
        .post('/api/v1/totp/setup')
        .auth(accessToken, { type: 'bearer' })
        .send({
          password: 'invalid',
        })
        .expect(400);
    });

    it('should respond with a `400` status code when 2fa is already enabled', async () => {
      const user = await UserFactory.create({
        password: 'password',
        twoFactorEnabled: true,
      });
      const accessToken = generateAccessToken(user);

      await request()
        .post('/api/v1/totp/setup')
        .auth(accessToken, { type: 'bearer' })
        .send({
          password: 'password',
        })
        .expect(400);
    });

    it('should respond with a `401` status code when unauthenticated', async () => {
      await request()
        .post('/api/v1/totp/setup')
        .send({
          password: 'invalid',
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/totp/enable', () => {
    it('should respond with a `204` status code', async () => {
      const secret = new OTPAuth.Secret();
      const user = await UserFactory.create({
        totpSecret: secret.base32,
      });
      const accessToken = generateAccessToken(user);

      await request()
        .post('/api/v1/totp/enable')
        .auth(accessToken, { type: 'bearer' })
        .send({
          otp: generateTOTP(user),
        })
        .expect(204);

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(dbUser?.twoFactorEnabled).toBe(true);
    });

    it('should respond with a `400` status code when otp is invalid', async () => {
      const secret = new OTPAuth.Secret();
      const user = await UserFactory.create({
        totpSecret: secret.base32,
      });
      const accessToken = generateAccessToken(user);

      await request()
        .post('/api/v1/totp/enable')
        .auth(accessToken, { type: 'bearer' })
        .send({
          otp: '123456',
        })
        .expect(400);
    });

    it('should respond with a `400` status code when secret is missing', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .post('/api/v1/totp/enable')
        .auth(accessToken, { type: 'bearer' })
        .send({
          otp: '123546',
        })
        .expect(400);
    });

    it('should respond with a `401` status code when unauthenticated', async () => {
      const secret = new OTPAuth.Secret();
      const user = await UserFactory.create({
        totpSecret: secret.base32,
      });

      await request()
        .post('/api/v1/totp/enable')
        .send({
          otp: generateTOTP(user),
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/totp/disable', () => {
    it('should respond with a `204` status code', async () => {
      const secret = new OTPAuth.Secret();
      const user = await UserFactory.create({
        twoFactorEnabled: true,
        totpSecret: secret.base32,
        password: 'password',
      });
      const accessToken = generateAccessToken(user);

      await request()
        .post('/api/v1/totp/disable')
        .auth(accessToken, { type: 'bearer' })
        .send({
          otp: generateTOTP(user),
          password: 'password',
        })
        .expect(204);

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(dbUser?.twoFactorEnabled).toBe(false);
    });

    it('should respond with a `400` status code when otp is invalid', async () => {
      const secret = new OTPAuth.Secret();
      const user = await UserFactory.create({
        twoFactorEnabled: true,
        totpSecret: secret.base32,
        password: 'password',
      });
      const accessToken = generateAccessToken(user);

      await request()
        .post('/api/v1/totp/disable')
        .auth(accessToken, { type: 'bearer' })
        .send({
          otp: '123456',
          password: 'password',
        })
        .expect(400);
    });

    it('should respond with a `400` status code when password is invalid', async () => {
      const secret = new OTPAuth.Secret();
      const user = await UserFactory.create({
        twoFactorEnabled: true,
        totpSecret: secret.base32,
        password: 'password',
      });
      const accessToken = generateAccessToken(user);

      await request()
        .post('/api/v1/totp/disable')
        .auth(accessToken, { type: 'bearer' })
        .send({
          otp: generateTOTP(user),
          password: 'invalid',
        })
        .expect(400);
    });

    it('should respond with a `400` status code when otp is disabled', async () => {
      const secret = new OTPAuth.Secret();
      const user = await UserFactory.create({
        twoFactorEnabled: false,
        totpSecret: secret.base32,
        password: 'password',
      });
      const accessToken = generateAccessToken(user);

      await request()
        .post('/api/v1/totp/disable')
        .auth(accessToken, { type: 'bearer' })
        .send({
          otp: generateTOTP(user),
          password: 'password',
        })
        .expect(400);
    });

    it('should respond with a `401` status code when unauthenticated', async () => {
      const secret = new OTPAuth.Secret();
      const user = await UserFactory.create({
        twoFactorEnabled: true,
        totpSecret: secret.base32,
        password: 'password',
      });

      await request()
        .post('/api/v1/totp/disable')
        .send({
          otp: generateTOTP(user),
          password: 'password',
        })
        .expect(401);
    });

    it('should disable using a recovery code instead of a totp', async () => {
      const secret = new OTPAuth.Secret();
      const user = await UserFactory.create({
        twoFactorEnabled: true,
        totpSecret: secret.base32,
        password: 'password',
      });
      await prisma.twoFactorRecoveryCode.create({
        data: {
          userId: user.id,
          code: bcrypt.hashSync('ABCDE12345', 8),
        },
      });
      const accessToken = generateAccessToken(user);

      await request()
        .post('/api/v1/totp/disable')
        .auth(accessToken, { type: 'bearer' })
        .send({
          otp: 'ABCDE-12345',
          password: 'password',
        })
        .expect(204);

      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(dbUser?.twoFactorEnabled).toBe(false);
      // Disabling 2FA clears any remaining recovery codes.
      const codes = await prisma.twoFactorRecoveryCode.findMany({
        where: { userId: user.id },
      });
      expect(codes).toHaveLength(0);
    });
  });

  describe('POST /api/v1/totp/recovery-codes', () => {
    it('should generate and persist recovery codes', async () => {
      const secret = new OTPAuth.Secret();
      const user = await UserFactory.create({
        twoFactorEnabled: true,
        totpSecret: secret.base32,
        password: 'password',
      });
      const accessToken = generateAccessToken(user);

      const { body } = await request()
        .post('/api/v1/totp/recovery-codes')
        .auth(accessToken, { type: 'bearer' })
        .send({
          password: 'password',
          otp: generateTOTP(user),
        })
        .expect(200);

      expect(body.data.codes).toHaveLength(10);
      expect(body.data.codes[0]).toEqual(expect.any(String));

      const stored = await prisma.twoFactorRecoveryCode.findMany({
        where: { userId: user.id },
      });
      expect(stored).toHaveLength(10);
      // Only hashes are stored, never the plaintext code.
      expect(stored.map((c) => c.code)).not.toContain(body.data.codes[0]);
    });

    it('should replace previously generated recovery codes', async () => {
      const secret = new OTPAuth.Secret();
      const user = await UserFactory.create({
        twoFactorEnabled: true,
        totpSecret: secret.base32,
        password: 'password',
      });
      const accessToken = generateAccessToken(user);

      const first = await request()
        .post('/api/v1/totp/recovery-codes')
        .auth(accessToken, { type: 'bearer' })
        .send({ password: 'password', otp: generateTOTP(user) })
        .expect(200);

      const second = await request()
        .post('/api/v1/totp/recovery-codes')
        .auth(accessToken, { type: 'bearer' })
        .send({ password: 'password', otp: generateTOTP(user) })
        .expect(200);

      expect(second.body.data.codes).not.toEqual(first.body.data.codes);

      const stored = await prisma.twoFactorRecoveryCode.findMany({
        where: { userId: user.id },
      });
      expect(stored).toHaveLength(10);
    });

    it('should respond with a `400` status code when password is invalid', async () => {
      const secret = new OTPAuth.Secret();
      const user = await UserFactory.create({
        twoFactorEnabled: true,
        totpSecret: secret.base32,
        password: 'password',
      });
      const accessToken = generateAccessToken(user);

      await request()
        .post('/api/v1/totp/recovery-codes')
        .auth(accessToken, { type: 'bearer' })
        .send({ password: 'invalid', otp: generateTOTP(user) })
        .expect(400);
    });

    it('should respond with a `400` status code when the otp is invalid', async () => {
      const secret = new OTPAuth.Secret();
      const user = await UserFactory.create({
        twoFactorEnabled: true,
        totpSecret: secret.base32,
        password: 'password',
      });
      const accessToken = generateAccessToken(user);

      await request()
        .post('/api/v1/totp/recovery-codes')
        .auth(accessToken, { type: 'bearer' })
        .send({ password: 'password', otp: '123456' })
        .expect(400);

      const stored = await prisma.twoFactorRecoveryCode.findMany({
        where: { userId: user.id },
      });
      expect(stored).toHaveLength(0);
    });

    it('should respond with a `400` status code when 2fa is not enabled', async () => {
      const user = await UserFactory.create({
        twoFactorEnabled: false,
        password: 'password',
      });
      const accessToken = generateAccessToken(user);

      await request()
        .post('/api/v1/totp/recovery-codes')
        .auth(accessToken, { type: 'bearer' })
        .send({ password: 'password', otp: '123456' })
        .expect(400);
    });

    it('should respond with a `401` status code when unauthenticated', async () => {
      await request()
        .post('/api/v1/totp/recovery-codes')
        .send({ password: 'password', otp: '123456' })
        .expect(401);
    });
  });
});
