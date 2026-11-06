import { describe, expect, it } from 'vitest';
import * as OTPAuth from 'otpauth';
import { UserFactory } from '../../../prisma/factories/index.js';
import type { User } from '#generated/prisma/client.js';
import { request } from '../utils/request.js';
import { generateAccessToken } from './utils/token.js';
import { SoftwareAuthenticator } from './utils/passkey.js';
import prisma from '../utils/prisma.js';

const TOTP_SECRET = new OTPAuth.Secret().base32;

const generateTOTP = () =>
  new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(TOTP_SECRET),
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  }).generate();

const createTwoFactorUser = () =>
  UserFactory.create({
    password: 'password',
    twoFactor: {
      create: { secret: TOTP_SECRET, confirmedAt: new Date() },
    },
  });

const requestRegistrationOptions = (user: User, body: object) =>
  request()
    .post('/api/v1/passkeys/registration/options')
    .auth(generateAccessToken(user), { type: 'bearer' })
    .send(body);

const registerPasskey = async (
  user: User,
  authenticator = new SoftwareAuthenticator(),
  name = 'Laptop',
) => {
  const { body: options } = await requestRegistrationOptions(user, {
    password: 'password',
  }).expect(200);

  const { body } = await request()
    .post('/api/v1/passkeys/registration/verify')
    .auth(generateAccessToken(user), { type: 'bearer' })
    .send({
      response: authenticator.register({ challenge: options.data.challenge }),
      name,
    })
    .expect(201);

  return { authenticator, passkey: body.data };
};

const requestLoginOptions = async (): Promise<string> => {
  const { body } = await request()
    .post('/api/v1/auth/passkey/options')
    .expect(200);

  return body.data.challenge;
};

// Resolves to the response once it matched `status`.
const loginWithPasskey = async (
  authenticator: SoftwareAuthenticator,
  status: number,
  challenge?: string,
) => {
  const response = authenticator.authenticate({
    challenge: challenge ?? (await requestLoginOptions()),
  });

  return request()
    .post('/api/v1/auth/passkey/verify')
    .send({ response })
    .expect(status);
};

describe('/api/v1/passkeys/', () => {
  describe('POST /api/v1/passkeys/registration/options', () => {
    it('should respond with creation options for a discoverable credential', async () => {
      const user = await UserFactory.create({ password: 'password' });

      const { body } = await requestRegistrationOptions(user, {
        password: 'password',
      }).expect(200);

      expect(body.data).toMatchObject({
        challenge: expect.any(String),
        user: { name: user.email },
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'required',
        },
      });

      const challenges = await prisma.passkeyChallenge.findMany({
        where: { userId: user.id },
      });
      expect(challenges).toHaveLength(1);
      expect(challenges[0]).toMatchObject({
        challenge: body.data.challenge,
        type: 'REGISTRATION',
      });
    });

    it("should exclude the user's existing passkeys", async () => {
      const user = await UserFactory.create({ password: 'password' });
      const { authenticator } = await registerPasskey(user);

      const { body } = await requestRegistrationOptions(user, {
        password: 'password',
      }).expect(200);

      expect(body.data.excludeCredentials).toEqual([
        expect.objectContaining({ id: authenticator.id }),
      ]);
    });

    it('should respond with a `400` status code when the password is wrong', async () => {
      const user = await UserFactory.create({ password: 'password' });

      await requestRegistrationOptions(user, { password: 'wrong' }).expect(400);
    });

    it('should respond with a `400` status code when two-factor is enabled and the otp is missing', async () => {
      const user = await createTwoFactorUser();

      await requestRegistrationOptions(user, { password: 'password' }).expect(
        400,
      );
    });

    it('should respond with a `400` status code when two-factor is enabled and the otp is wrong', async () => {
      const user = await createTwoFactorUser();

      await requestRegistrationOptions(user, {
        password: 'password',
        otp: '000000',
      }).expect(400);
    });

    it('should respond with a `200` status code when two-factor is enabled and the otp is correct', async () => {
      const user = await createTwoFactorUser();

      await requestRegistrationOptions(user, {
        password: 'password',
        otp: generateTOTP(),
      }).expect(200);
    });

    it('should respond with a `401` status code when unauthenticated', async () => {
      await request()
        .post('/api/v1/passkeys/registration/options')
        .send({ password: 'password' })
        .expect(401);
    });
  });

  describe('POST /api/v1/passkeys/registration/verify', () => {
    it('should store the passkey', async () => {
      const user = await UserFactory.create({ password: 'password' });

      const { authenticator, passkey } = await registerPasskey(
        user,
        undefined,
        'My phone',
      );

      expect(passkey).toEqual({
        id: expect.any(String),
        name: 'My phone',
        deviceType: 'singleDevice',
        backedUp: false,
        createdAt: expect.any(String),
        lastUsedAt: null,
      });

      const stored = await prisma.userPasskey.findUniqueOrThrow({
        where: { id: passkey.id },
      });
      expect(stored).toMatchObject({
        userId: user.id,
        credentialId: authenticator.id,
        counter: 0,
        transports: ['internal'],
      });
    });

    it('should consume the challenge', async () => {
      const user = await UserFactory.create({ password: 'password' });
      const authenticator = new SoftwareAuthenticator();
      const { body: options } = await requestRegistrationOptions(user, {
        password: 'password',
      }).expect(200);
      const response = authenticator.register({
        challenge: options.data.challenge,
      });

      const verify = () =>
        request()
          .post('/api/v1/passkeys/registration/verify')
          .auth(generateAccessToken(user), { type: 'bearer' })
          .send({ response, name: 'Laptop' });

      await verify().expect(201);
      await verify().expect(400);
    });

    it("should respond with a `400` status code for another user's challenge", async () => {
      const owner = await UserFactory.create({ password: 'password' });
      const other = await UserFactory.create({ password: 'password' });
      const { body: options } = await requestRegistrationOptions(owner, {
        password: 'password',
      }).expect(200);

      await request()
        .post('/api/v1/passkeys/registration/verify')
        .auth(generateAccessToken(other), { type: 'bearer' })
        .send({
          response: new SoftwareAuthenticator().register({
            challenge: options.data.challenge,
          }),
          name: 'Laptop',
        })
        .expect(400);

      expect(await prisma.userPasskey.count()).toBe(0);
    });

    it('should respond with a `400` status code for an expired challenge', async () => {
      const user = await UserFactory.create({ password: 'password' });
      const { body: options } = await requestRegistrationOptions(user, {
        password: 'password',
      }).expect(200);
      await prisma.passkeyChallenge.updateMany({
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      await request()
        .post('/api/v1/passkeys/registration/verify')
        .auth(generateAccessToken(user), { type: 'bearer' })
        .send({
          response: new SoftwareAuthenticator().register({
            challenge: options.data.challenge,
          }),
          name: 'Laptop',
        })
        .expect(400);
    });

    it('should respond with a `400` status code without user verification', async () => {
      const user = await UserFactory.create({ password: 'password' });
      const { body: options } = await requestRegistrationOptions(user, {
        password: 'password',
      }).expect(200);

      await request()
        .post('/api/v1/passkeys/registration/verify')
        .auth(generateAccessToken(user), { type: 'bearer' })
        .send({
          response: new SoftwareAuthenticator().register({
            challenge: options.data.challenge,
            userVerified: false,
          }),
          name: 'Laptop',
        })
        .expect(400);
    });

    it('should respond with a `400` status code for a foreign origin', async () => {
      const user = await UserFactory.create({ password: 'password' });
      const { body: options } = await requestRegistrationOptions(user, {
        password: 'password',
      }).expect(200);

      await request()
        .post('/api/v1/passkeys/registration/verify')
        .auth(generateAccessToken(user), { type: 'bearer' })
        .send({
          response: new SoftwareAuthenticator().register({
            challenge: options.data.challenge,
            origin: 'https://evil.example',
          }),
          name: 'Laptop',
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/passkeys', () => {
    it("should list only the user's passkeys", async () => {
      const user = await UserFactory.create({ password: 'password' });
      const other = await UserFactory.create({ password: 'password' });
      const { passkey } = await registerPasskey(user);
      await registerPasskey(other);

      const { body } = await request()
        .get('/api/v1/passkeys')
        .auth(generateAccessToken(user), { type: 'bearer' })
        .expect(200);

      expect(body.data).toEqual([passkey]);
    });
  });

  describe('PATCH /api/v1/passkeys/:passkeyId', () => {
    it('should rename the passkey', async () => {
      const user = await UserFactory.create({ password: 'password' });
      const { passkey } = await registerPasskey(user);

      const { body } = await request()
        .patch(`/api/v1/passkeys/${passkey.id}`)
        .auth(generateAccessToken(user), { type: 'bearer' })
        .send({ name: 'Work laptop' })
        .expect(200);

      expect(body.data.name).toBe('Work laptop');
    });

    it("should respond with a `404` status code for another user's passkey", async () => {
      const owner = await UserFactory.create({ password: 'password' });
      const other = await UserFactory.create({ password: 'password' });
      const { passkey } = await registerPasskey(owner);

      await request()
        .patch(`/api/v1/passkeys/${passkey.id}`)
        .auth(generateAccessToken(other), { type: 'bearer' })
        .send({ name: 'Mine now' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/passkeys/:passkeyId', () => {
    it('should delete the passkey', async () => {
      const user = await UserFactory.create({ password: 'password' });
      const { passkey } = await registerPasskey(user);

      await request()
        .delete(`/api/v1/passkeys/${passkey.id}`)
        .auth(generateAccessToken(user), { type: 'bearer' })
        .send({ password: 'password' })
        .expect(204);

      expect(await prisma.userPasskey.count()).toBe(0);
    });

    it('should respond with a `400` status code when the password is wrong', async () => {
      const user = await UserFactory.create({ password: 'password' });
      const { passkey } = await registerPasskey(user);

      await request()
        .delete(`/api/v1/passkeys/${passkey.id}`)
        .auth(generateAccessToken(user), { type: 'bearer' })
        .send({ password: 'wrong' })
        .expect(400);

      expect(await prisma.userPasskey.count()).toBe(1);
    });

    it("should respond with a `404` status code for another user's passkey", async () => {
      const owner = await UserFactory.create({ password: 'password' });
      const other = await UserFactory.create({ password: 'password' });
      const { passkey } = await registerPasskey(owner);

      await request()
        .delete(`/api/v1/passkeys/${passkey.id}`)
        .auth(generateAccessToken(other), { type: 'bearer' })
        .send({ password: 'password' })
        .expect(404);

      expect(await prisma.userPasskey.count()).toBe(1);
    });
  });
});

describe('/api/v1/auth/passkey/', () => {
  describe('POST /api/v1/auth/passkey/options', () => {
    it('should respond with request options not bound to a user', async () => {
      const { body } = await request()
        .post('/api/v1/auth/passkey/options')
        .expect(200);

      expect(body.data).toMatchObject({
        challenge: expect.any(String),
        userVerification: 'required',
      });
      expect(body.data.allowCredentials).toBeUndefined();

      const challenge = await prisma.passkeyChallenge.findFirstOrThrow({
        where: { challenge: body.data.challenge },
      });
      expect(challenge).toMatchObject({
        type: 'AUTHENTICATION',
        userId: null,
      });
    });
  });

  describe('POST /api/v1/auth/passkey/verify', () => {
    it('should log the user in', async () => {
      const user = await UserFactory.create({ password: 'password' });
      const { authenticator, passkey } = await registerPasskey(user);

      const { body } = await loginWithPasskey(authenticator, 200);

      expect(body.profile).toHaveProperty('id', user.id);
      expect(body.tokens).toHaveProperty('access');

      const stored = await prisma.userPasskey.findUniqueOrThrow({
        where: { id: passkey.id },
      });
      expect(stored.counter).toBe(1);
      expect(stored.lastUsedAt).not.toBeNull();
    });

    it('should skip the TOTP step', async () => {
      const user = await createTwoFactorUser();
      const authenticator = new SoftwareAuthenticator();
      const { body: options } = await requestRegistrationOptions(user, {
        password: 'password',
        otp: generateTOTP(),
      }).expect(200);
      await request()
        .post('/api/v1/passkeys/registration/verify')
        .auth(generateAccessToken(user), { type: 'bearer' })
        .send({
          response: authenticator.register({
            challenge: options.data.challenge,
          }),
          name: 'Laptop',
        })
        .expect(201);

      const { body } = await loginWithPasskey(authenticator, 200);

      expect(body.profile).toHaveProperty('id', user.id);
    });

    it('should respond with a partial auth when the email is not verified', async () => {
      const user = await UserFactory.create({
        password: 'password',
        emailVerified: false,
      });
      const { authenticator } = await registerPasskey(user);

      const { body } = await loginWithPasskey(authenticator, 403);

      expect(body).toHaveProperty('status', 'PARTIAL_AUTH');
      expect(body).toHaveProperty('partialAuthType', 'EMAIL_NOT_VERIFIED');
    });

    it('should respond with a `403` status code when the user is locked', async () => {
      const user = await UserFactory.create({ password: 'password' });
      const { authenticator } = await registerPasskey(user);
      await prisma.user.update({
        where: { id: user.id },
        data: { locked: true },
      });

      await loginWithPasskey(authenticator, 403);
    });

    it('should respond with a `401` status code for an unknown passkey', async () => {
      await loginWithPasskey(new SoftwareAuthenticator(), 401);
    });

    it('should respond with a `401` status code when the challenge is reused', async () => {
      const user = await UserFactory.create({ password: 'password' });
      const { authenticator } = await registerPasskey(user);
      const challenge = await requestLoginOptions();

      await loginWithPasskey(authenticator, 200, challenge);
      await loginWithPasskey(authenticator, 401, challenge);
    });

    it('should respond with a `401` status code for an unknown challenge', async () => {
      const user = await UserFactory.create({ password: 'password' });
      const { authenticator } = await registerPasskey(user);

      await loginWithPasskey(authenticator, 401, 'bm90LWlzc3VlZA');
    });

    it('should respond with a `401` status code when the counter goes backwards', async () => {
      const user = await UserFactory.create({ password: 'password' });
      const { authenticator } = await registerPasskey(user);
      await loginWithPasskey(authenticator, 200);

      authenticator.rewindCounter();

      await loginWithPasskey(authenticator, 401);
    });

    it('should respond with a `401` status code once the passkey is deleted', async () => {
      const user = await UserFactory.create({ password: 'password' });
      const { authenticator, passkey } = await registerPasskey(user);
      await request()
        .delete(`/api/v1/passkeys/${passkey.id}`)
        .auth(generateAccessToken(user), { type: 'bearer' })
        .send({ password: 'password' })
        .expect(204);

      await loginWithPasskey(authenticator, 401);
    });
  });
});
