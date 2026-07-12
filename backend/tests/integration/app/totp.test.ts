import { describe, expect, it } from 'vitest';
import * as OTPAuth from 'otpauth';
import { UserFactory } from '../../../prisma/factories/index.js';
import { request } from '../utils/request.js';
import { generateAccessToken } from './utils/token.js';
import { hashRecoveryCode } from './utils/recoveryCode.js';
import prisma from '../utils/prisma.js';

describe('/api/v1/totp/', () => {
  const TOTP_SECRET = new OTPAuth.Secret().base32;

  const generateTOTP = () => {
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(TOTP_SECRET),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    return totp.generate();
  };

  const createTwoFactorUser = (confirmed = true) => {
    return UserFactory.create({
      password: 'password',
      twoFactor: {
        create: {
          secret: TOTP_SECRET,
          confirmedAt: confirmed ? new Date() : null,
        },
      },
    });
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

      const dbTwoFactor = await prisma.userTwoFactor.findUnique({
        where: { userId: user.id },
      });

      // Setup is pending until the user confirms with a valid code
      expect(dbTwoFactor?.confirmedAt).toBeNull();
      expect(dbTwoFactor?.secret).toBe(body.data.secret);
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
      const user = await createTwoFactorUser();
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
      const user = await createTwoFactorUser(false);
      const accessToken = generateAccessToken(user);

      await request()
        .post('/api/v1/totp/enable')
        .auth(accessToken, { type: 'bearer' })
        .send({
          otp: generateTOTP(),
        })
        .expect(204);

      const dbTwoFactor = await prisma.userTwoFactor.findUnique({
        where: { userId: user.id },
      });
      expect(dbTwoFactor?.confirmedAt).not.toBeNull();
    });

    it('should respond with a `400` status code when otp is invalid', async () => {
      const user = await createTwoFactorUser(false);
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
      await createTwoFactorUser(false);

      await request()
        .post('/api/v1/totp/enable')
        .send({
          otp: generateTOTP(),
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/totp/disable', () => {
    it('should respond with a `204` status code', async () => {
      const user = await createTwoFactorUser();
      const accessToken = generateAccessToken(user);

      await request()
        .post('/api/v1/totp/disable')
        .auth(accessToken, { type: 'bearer' })
        .send({
          otp: generateTOTP(),
          password: 'password',
        })
        .expect(204);

      const dbTwoFactor = await prisma.userTwoFactor.findUnique({
        where: { userId: user.id },
      });
      expect(dbTwoFactor).toBeNull();
    });

    it('should respond with a `400` status code when otp is invalid', async () => {
      const user = await createTwoFactorUser();
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
      const user = await createTwoFactorUser();
      const accessToken = generateAccessToken(user);

      await request()
        .post('/api/v1/totp/disable')
        .auth(accessToken, { type: 'bearer' })
        .send({
          otp: generateTOTP(),
          password: 'invalid',
        })
        .expect(400);
    });

    it('should respond with a `400` status code when otp is disabled', async () => {
      const user = await createTwoFactorUser(false);
      const accessToken = generateAccessToken(user);

      await request()
        .post('/api/v1/totp/disable')
        .auth(accessToken, { type: 'bearer' })
        .send({
          otp: generateTOTP(),
          password: 'password',
        })
        .expect(400);
    });

    it('should respond with a `401` status code when unauthenticated', async () => {
      await createTwoFactorUser();

      await request()
        .post('/api/v1/totp/disable')
        .send({
          otp: generateTOTP(),
          password: 'password',
        })
        .expect(401);
    });

    it('should disable using a recovery code instead of a totp', async () => {
      const user = await createTwoFactorUser();
      await prisma.twoFactorRecoveryCode.create({
        data: {
          userId: user.id,
          code: hashRecoveryCode('ABCDE12345'),
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

      const dbTwoFactor = await prisma.userTwoFactor.findUnique({
        where: { userId: user.id },
      });
      expect(dbTwoFactor).toBeNull();
      // Disabling 2FA clears any remaining recovery codes.
      const codes = await prisma.twoFactorRecoveryCode.findMany({
        where: { userId: user.id },
      });
      expect(codes).toHaveLength(0);
    });
  });

  describe('POST /api/v1/totp/recovery-codes', () => {
    it('should generate and persist recovery codes', async () => {
      const user = await createTwoFactorUser();
      const accessToken = generateAccessToken(user);

      const { body } = await request()
        .post('/api/v1/totp/recovery-codes')
        .auth(accessToken, { type: 'bearer' })
        .send({
          password: 'password',
          otp: generateTOTP(),
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
      const user = await createTwoFactorUser();
      const accessToken = generateAccessToken(user);

      const first = await request()
        .post('/api/v1/totp/recovery-codes')
        .auth(accessToken, { type: 'bearer' })
        .send({ password: 'password', otp: generateTOTP() })
        .expect(200);

      const second = await request()
        .post('/api/v1/totp/recovery-codes')
        .auth(accessToken, { type: 'bearer' })
        .send({ password: 'password', otp: generateTOTP() })
        .expect(200);

      expect(second.body.data.codes).not.toEqual(first.body.data.codes);

      const stored = await prisma.twoFactorRecoveryCode.findMany({
        where: { userId: user.id },
      });
      expect(stored).toHaveLength(10);
    });

    it('should respond with a `400` status code when password is invalid', async () => {
      const user = await createTwoFactorUser();
      const accessToken = generateAccessToken(user);

      await request()
        .post('/api/v1/totp/recovery-codes')
        .auth(accessToken, { type: 'bearer' })
        .send({ password: 'invalid', otp: generateTOTP() })
        .expect(400);
    });

    it('should respond with a `400` status code when the otp is invalid', async () => {
      const user = await createTwoFactorUser();
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
