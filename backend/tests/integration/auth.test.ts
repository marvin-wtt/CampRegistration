import { beforeEach, describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { TokenType, User } from '@prisma/client';
import {
  CampFactory,
  UserFactory,
  TokenFactory,
  CampManagerFactory,
  InvitationFactory,
} from '../../prisma/factories';
import {
  generateAccessToken,
  generateExpiredToken,
  generateOTPToken,
  generateRefreshToken,
  generateResetPasswordToken,
  generateSendVerifyEmailToken,
  generateToken,
  generateVerifyEmailToken,
  verifyToken,
} from '../utils/token';
import { request } from '../utils/request';
import mailer from '../../src/core/mail';
import * as OTPAuth from 'otpauth';

describe('/api/v1/auth', async () => {
  describe('POST /api/v1/auth/register', () => {
    it('should respond with a `201` status code when provided with details', async () => {
      await request()
        .post('/api/v1/auth/register')
        .send({
          name: 'testuser',
          email: 'test@email.net',
          password: 'Password1',
        })
        .expect(201);
    });

    it('should respond with the user profile when successful', async () => {
      const { body } = await request()
        .post('/api/v1/auth/register')
        .send({
          name: 'testuser',
          email: 'test@email.net',
          password: 'Password1',
        })
        .expect(201);

      const newUser = await prisma.user.findFirst();

      expect(newUser).not.toBeNull();
      expect(body).toStrictEqual({
        email: 'test@email.net',
        name: 'testuser',
        locale: expect.anything(),
      });
    });

    it('should make the user camp manager if the user has pending invitations', async () => {
      await CampManagerFactory.create({
        camp: { create: CampFactory.build() },
        invitation: {
          create: InvitationFactory.build({
            email: 'test@email.net',
          }),
        },
      });

      await request()
        .post('/api/v1/auth/register')
        .send({
          name: 'testuser',
          email: 'test@email.net',
          password: 'Password1',
        })
        .expect(201);

      const manager = await prisma.campManager.findFirst({
        where: {
          user: {
            email: 'test@email.net',
          },
        },
        include: {
          invitation: true,
        },
      });

      expect(manager).toBeDefined();
      expect(manager?.invitation).toBeNull();
    });

    it('should set the role to "USER"', async () => {
      await request()
        .post('/api/v1/auth/register')
        .send({
          name: 'testuser',
          email: 'test@email.net',
          password: 'Password1',
        })
        .expect(201);

      const user = await prisma.user.findFirst({
        where: {
          email: 'test@email.net',
        },
      });

      expect(user.role).toBe('USER');
    });

    it('should respond with a `400` status code if an invalid email body is provided', async () => {
      await request()
        .post('/api/v1/auth/register')
        .send({
          name: 'testuser',
          email: 'test(at)email.net',
          password: 'Password1',
        })
        .expect(400);

      const userCount = await prisma.user.count();
      expect(userCount).toBe(0);
    });

    it('should respond with a `400` status code if an invalid password is provided', async () => {
      await request()
        .post('/api/v1/auth/register')
        .send({
          name: 'testuser',
          email: 'test@email.net',
          password: 'invalid',
        })
        .expect(400);

      const userCount = await prisma.user.count();

      expect(userCount).toBe(0);
    });

    it('should respond with a `400` status code if the email is already used', async () => {
      await UserFactory.create({
        email: 'test@email.net',
        name: 'test',
        password: '',
      });

      await request()
        .post('/api/v1/auth/register')
        .send({
          name: 'testuser',
          email: 'test@email.net',
          password: 'Password1',
        })
        .expect(400);

      const userCount = await prisma.user.count();

      expect(userCount).toBe(1);
    });

    it('should ignore the role in request body if set', async () => {
      await request()
        .post('/api/v1/auth/register')
        .send({
          name: 'testuser',
          email: 'test@email.net',
          password: 'Password1',
          role: 'ADMIN',
        })
        .expect(201);

      const user = await prisma.user.findFirst({
        where: {
          email: 'test@email.net',
        },
      });

      expect(user.role).toBe('USER');
    });

    it('should encode the user password', async () => {
      const data = {
        name: 'testuser',
        email: 'test@email.net',
        password: 'Password1',
      };

      await request().post('/api/v1/auth/register').send(data).expect(201);

      const user = await prisma.user.findUniqueOrThrow({
        where: { email: data.email },
      });

      expect(user).toBeDefined();
      expect(bcrypt.compareSync(data.password, user.password)).toBeTruthy();
    });

    it('should set USER role as default', async () => {
      await request()
        .post('/api/v1/auth/register')
        .send({
          name: 'testuser',
          email: 'test@email.net',
          password: 'Password1',
        })
        .expect(201);

      const user = (await prisma.user.findFirst()) as User;

      expect(user.role).toEqual('USER');
    });

    it('should store user preferred locale when successful', async () => {
      const data = {
        name: 'testuser',
        email: 'test@email.net',
        password: 'Password1',
      };

      const { body } = await request()
        .post('/api/v1/auth/register')
        .set('Accept-Language', 'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5')
        .send(data)
        .expect(201);

      expect(body).toHaveProperty('locale', 'fr-CH');
    });

    it('should use en-US as default locale', async () => {
      const data = {
        name: 'testuser',
        email: 'test@email.net',
        password: 'Password1',
      };

      const { body } = await request()
        .post('/api/v1/auth/register')
        .send(data)
        .expect(201);

      expect(body).toHaveProperty('locale', 'en-US');
    });

    it('should send a welcome notification to the user', async () => {
      const data = {
        name: 'testuser',
        email: 'test@email.net',
        password: 'Password1',
      };

      await request().post('/api/v1/auth/register').send(data).expect(201);

      expect(mailer.sendMail).toBeCalledTimes(1);
      expect(mailer.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: data.email,
        }),
      );
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const createUser = async () => {
      return UserFactory.create({
        name: 'testuser',
        email: 'test@email.net',
        password: 'password',
      });
    };

    it('should respond with a `200` status code when provided valid credentials', async () => {
      await createUser();

      await request()
        .post('/api/v1/auth/login')
        .send({
          email: 'test@email.net',
          password: 'password',
        })
        .expect(200);
    });

    it('should respond with a `200` status code when provided valid credentials and remember', async () => {
      await createUser();

      await request()
        .post('/api/v1/auth/login')
        .send({
          email: 'test@email.net',
          password: 'password',
          remember: true,
        })
        .expect(200);
    });

    it('should respond with the user details when successful', async () => {
      await createUser();

      const { body } = await request()
        .post('/api/v1/auth/login')
        .send({
          email: 'test@email.net',
          password: 'password',
        })
        .expect(200);

      expect(body).toHaveProperty('profile.email', 'test@email.net');
      expect(body).toHaveProperty('profile.name', 'testuser');
    });

    it('should respond with camps when successful', async () => {
      const user = await UserFactory.create({
        email: 'manager@email.net',
        password: 'password',
      });
      const camp = await CampFactory.create();
      await CampManagerFactory.create({
        camp: { connect: { id: camp.id } },
        user: { connect: { id: user.id } },
      });

      const { body } = await request()
        .post('/api/v1/auth/login')
        .send({
          email: 'manager@email.net',
          password: 'password',
        })
        .expect(200);

      expect(body).toHaveProperty('profile.camps');
      expect(body.profile.camps.length).toBe(1);
    });

    it('should respond with access token', async () => {
      await createUser();

      const { body } = await request()
        .post('/api/v1/auth/login')
        .send({
          email: 'test@email.net',
          password: 'password',
        })
        .expect(200);

      expect(body).toHaveProperty('tokens.access.token');
      expect(body).toHaveProperty('tokens.access.expires');

      const tokenData = verifyToken(body.tokens.access.token);
      expect(tokenData).toBeDefined();
      expect(tokenData['type']).toBe('ACCESS');
    });

    it('should store the refresh token when remember is set', async () => {
      await createUser();

      await request().post('/api/v1/auth/login').send({
        email: 'test@email.net',
        password: 'password',
        remember: true,
      });

      const tokenCount = await prisma.token.count({
        where: {
          type: TokenType.REFRESH,
        },
      });

      expect(tokenCount).toBe(1);
    });

    it('should set access token as cookie when successful', async () => {
      await createUser();

      const { headers } = await request()
        .post('/api/v1/auth/login')
        .send({
          email: 'test@email.net',
          password: 'password',
        })
        .expect(200);

      const setCookie = headers['set-cookie'];

      expect(setCookie).toContainEqual(expect.stringMatching(/^accessToken.*/));
    });

    it('should not set refresh token as cookie without remember', async () => {
      await createUser();

      const { headers } = await request()
        .post('/api/v1/auth/login')
        .send({
          email: 'test@email.net',
          password: 'password',
        })
        .expect(200);

      const setCookie = headers['set-cookie'];

      expect(setCookie).not.toContainEqual(
        expect.stringMatching(/^refreshToken.*/),
      );
    });

    it('should respond with refresh token when remember is set when successful', async () => {
      await createUser();

      const { body } = await request()
        .post('/api/v1/auth/login')
        .send({
          email: 'test@email.net',
          password: 'password',
          remember: true,
        })
        .expect(200);

      expect(body).toHaveProperty('tokens.refresh.token');
      expect(body).toHaveProperty('tokens.refresh.expires');

      const tokenData = verifyToken(body.tokens.refresh.token);
      expect(tokenData).toBeDefined();
      expect(tokenData['type']).toBe('REFRESH');
    });

    it('should set access token and refresh token as cookie with remember when successful', async () => {
      await createUser();

      const { headers } = await request()
        .post('/api/v1/auth/login')
        .send({
          email: 'test@email.net',
          password: 'password',
          remember: true,
        })
        .expect(200);

      const setCookie = headers['set-cookie'];

      expect(setCookie).toContainEqual(expect.stringMatching(/^accessToken.*/));
      expect(setCookie).toContainEqual(
        expect.stringMatching(/^refreshToken.*/),
      );
    });

    it('should update user last seen time', async () => {
      const { id } = await createUser();

      const timestamp = new Date().getTime();

      await request()
        .post('/api/v1/auth/login')
        .send({
          email: 'test@email.net',
          password: 'password',
        })
        .expect(200);

      const user = await prisma.user.findUnique({
        where: { id },
      });

      expect(user.lastSeen.getTime()).toBeGreaterThanOrEqual(timestamp);
    });

    it('should respond with a `403` status code when 2fA is enabled', async () => {
      await UserFactory.create({
        email: 'test@email.net',
        password: 'password',
        twoFactorEnabled: true,
      });

      const { body, headers } = await request()
        .post('/api/v1/auth/login')
        .send({
          email: 'test@email.net',
          password: 'password',
        })
        .expect(403);

      expect(body).toHaveProperty('token');

      const tokenData = verifyToken(body.token);
      expect(tokenData).toBeDefined();
      expect(tokenData['type']).toBe('OTP');

      expect(headers).toHaveProperty('www-authenticate');

      expect(body).toHaveProperty('status', 'PARTIAL_AUTH');
      expect(body).toHaveProperty('partialAuthType', 'TOTP_REQUIRED');
    });

    it('should respond with a `403` status code when email is not verified', async () => {
      await UserFactory.create({
        email: 'test2@email.net',
        emailVerified: false,
        password: 'password',
      });

      const { body } = await request()
        .post('/api/v1/auth/login')
        .send({
          email: 'test2@email.net',
          password: 'password',
          remember: true,
        })
        .expect(403);

      expect(body).toHaveProperty('token');

      const tokenData = verifyToken(body.token);
      expect(tokenData).toBeDefined();
      expect(tokenData['type']).toBe('SEND_VERIFY_EMAIL');

      expect(body).toHaveProperty('status', 'PARTIAL_AUTH');
      expect(body).toHaveProperty('partialAuthType', 'EMAIL_NOT_VERIFIED');
    });

    it('should respond with a `403` status code when user is locked', async () => {
      await UserFactory.create({
        email: 'test@email.net',
        password: 'password',
        locked: true,
      });

      await request()
        .post('/api/v1/auth/login')
        .send({
          email: 'test@email.net',
          password: 'password',
        })
        .expect(403);
    });

    it('should respond with a `400` status code when given invalid credentials', async () => {
      await createUser();

      const { body } = await request()
        .post('/api/v1/auth/login')
        .send({
          email: 'test@email.net',
          password: 'wrongpassword',
        })
        .expect(400);

      expect(body).not.toHaveProperty('tokens');
      expect(body).not.toHaveProperty('user');
    });

    it('should respond with a `400` status code when the user cannot be found', async () => {
      const { body } = await request()
        .post('/api/v1/auth/login')
        .send({
          email: 'test@email.net',
          password: 'testpassword',
        })
        .expect(400);

      expect(body).not.toHaveProperty('token');
    });

    // TODO Rate limiter must not be mocked for this test
    it.skip('should respond with a `429` status code when too many invalid requests are send', async () => {
      const sendRequest = () => {
        return request().post('/api/v1/auth/login').send({
          email: 'test@email.net',
          password: 'wrongpassword',
        });
      };

      await Promise.all(Array.from({ length: 10 }, sendRequest));

      await sendRequest().expect(429);
    });
  });

  describe('POST /api/v1/auth/verify-otp', () => {
    const createUser = async () => {
      const secret = new OTPAuth.Secret();

      return UserFactory.create({
        email: 'test@email.net',
        password: 'password',
        twoFactorEnabled: true,
        totpSecret: secret.base32,
      });
    };

    const generateTOTP = (user: User) => {
      const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(user.totpSecret),
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
      });

      return totp.generate();
    };

    it('should respond with a `200` status code when totp is correct', async () => {
      const user = await createUser();
      const totp = generateTOTP(user);
      const token = generateOTPToken(user);

      await request()
        .post('/api/v1/auth/verify-otp')
        .send({
          otp: totp,
          token,
        })
        .expect(200);
    });

    describe('response', () => {
      it('should respond with access token', async () => {
        const user = await createUser();
        const totp = generateTOTP(user);
        const token = generateOTPToken(user);

        const { body, headers } = await request()
          .post('/api/v1/auth/verify-otp')
          .send({
            otp: totp,
            token,
          })
          .expect(200);

        //  Body
        expect(body).toHaveProperty('tokens.access.token');
        expect(body).toHaveProperty('tokens.access.expires');

        // Cookies
        expect(headers['set-cookie']).toContainEqual(
          expect.stringMatching(/^accessToken.*/),
        );

        // Token content
        const tokenData = verifyToken(body.tokens.access.token);
        expect(tokenData).toBeDefined();
        expect(tokenData['type']).toBe('ACCESS');
      });

      it('should respond with refresh token when remember is set', async () => {
        const user = await createUser();
        const totp = generateTOTP(user);
        const token = generateOTPToken(user);

        const { body, headers } = await request()
          .post('/api/v1/auth/verify-otp')
          .send({
            otp: totp,
            token,
            remember: true,
          })
          .expect(200);

        //  Body
        expect(body).toHaveProperty('tokens.refresh.token');
        expect(body).toHaveProperty('tokens.refresh.expires');

        // Cookies
        expect(headers['set-cookie']).toContainEqual(
          expect.stringMatching(/^accessToken.*/),
        );

        // Token content
        const tokenData = verifyToken(body.tokens.refresh.token);
        expect(tokenData).toBeDefined();
        expect(tokenData['type']).toBe('REFRESH');

        // DB
        const dbToken = await prisma.token.findFirst({
          where: {
            type: 'REFRESH',
            token: body.tokens.refresh.token,
            userId: user.id,
          },
        });
        expect(dbToken).toBeDefined();
      });
    });

    it('should respond with a `400` status code when totp is invalid', async () => {
      const user = await createUser();
      const token = generateOTPToken(user);

      await request()
        .post('/api/v1/auth/verify-otp')
        .send({
          otp: '123456',
          token,
        })
        .expect(400);
    });

    it('should respond with a `400` status code when token is invalid', async () => {
      const user = await createUser();
      const totp = generateTOTP(user);

      const token = generateAccessToken(user);

      await request()
        .post('/api/v1/auth/verify-otp')
        .send({
          otp: totp,
          token,
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should respond with a `204` status code when the user is authenticated', async () => {
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .post(`/api/v1/auth/logout/`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(204);
    });

    it('should remove access and refresh token cookie when successful', async () => {
      const accessToken = generateAccessToken(await UserFactory.create());

      const { headers } = await request()
        .post(`/api/v1/auth/logout/`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      const cookieStrings = headers['set-cookie'] as unknown as string[];
      const cookies = cookieStrings.map((item: string) => item.split(';')[0]);

      expect(cookies).toContain('accessToken=');
      expect(cookies).toContain('refreshToken=');
    });

    it('should blacklist the refresh token from body when successful', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      await TokenFactory.create({
        token: refreshToken,
        type: TokenType.REFRESH,
        user: { connect: { id: user.id } },
      });

      await request()
        .post(`/api/v1/auth/logout/`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .set('Cookie', `refreshToken=${refreshToken}; HttpOnly`)
        .expect(204);

      const count = await prisma.token.count({
        where: {
          userId: user.id,
          blacklisted: true,
        },
      });

      expect(count).toBe(1);
    });

    it('should blacklist the refresh token from cookie when successful', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      await TokenFactory.create({
        token: refreshToken,
        type: TokenType.REFRESH,
        user: { connect: { id: user.id } },
      });

      const data = {
        refreshToken,
      };

      await request()
        .post(`/api/v1/auth/logout/`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      const count = await prisma.token.count({
        where: {
          userId: user.id,
          blacklisted: true,
        },
      });

      expect(count).toBe(1);
    });

    it('should respond with a `401` status code when the user unauthenticated', async () => {
      await request().post(`/api/v1/auth/logout/`).send().expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh-tokens', () => {
    const createUserWithToken = async () => {
      const user = await UserFactory.create();
      const refreshToken = generateRefreshToken(user);
      await TokenFactory.create({
        token: refreshToken,
        type: TokenType.REFRESH,
        user: { connect: { id: user.id } },
      });

      return { user, refreshToken };
    };

    it('should respond with a `200` status code when token is provided in body', async () => {
      const { refreshToken } = await createUserWithToken();

      const data = {
        refreshToken,
      };

      await request()
        .post(`/api/v1/auth/refresh-tokens/`)
        .send(data)
        .expect(200);
    });

    it('should respond with a `200` status code when token is provided as cookie', async () => {
      const { refreshToken } = await createUserWithToken();

      await request()
        .post(`/api/v1/auth/refresh-tokens/`)
        .send()
        .set('Cookie', `refreshToken=${refreshToken}; HttpOnly`)
        .expect(200);
    });

    it('should respond with a new access and refresh token when successful', async () => {
      const { refreshToken } = await createUserWithToken();

      const data = {
        refreshToken,
      };

      const { body } = await request()
        .post(`/api/v1/auth/refresh-tokens/`)
        .send(data)
        .expect(200);

      expect(body).toHaveProperty('refresh');
      expect(body.refresh).not.toBe(refreshToken);
      expect(body).toHaveProperty('access');
    });

    it('should respond with a access and refresh cookie when successful', async () => {
      const { refreshToken } = await createUserWithToken();

      const data = {
        refreshToken,
      };

      const { headers } = await request()
        .post(`/api/v1/auth/refresh-tokens/`)
        .send(data)
        .expect(200);

      const setCookie = headers['set-cookie'];

      expect(setCookie).toContainEqual(expect.stringMatching(/^accessToken.*/));
      expect(setCookie).toContainEqual(
        expect.stringMatching(/^refreshToken.*/),
      );
    });

    it('should update user last seen time', async () => {
      const {
        refreshToken,
        user: { id },
      } = await createUserWithToken();

      const timestamp = new Date().getTime();

      const data = {
        refreshToken,
      };

      await request()
        .post(`/api/v1/auth/refresh-tokens/`)
        .send(data)
        .expect(200);

      const user = await prisma.user.findUnique({
        where: { id },
      });

      expect(user.lastSeen.getTime()).toBeGreaterThanOrEqual(timestamp);
    });

    it('should respond with `400` status code when the user has no refresh token', async () => {
      await request().post(`/api/v1/auth/refresh-tokens/`).send().expect(400);
    });

    it('should respond with `401` status code when the token is missing', async () => {
      const refreshToken = generateRefreshToken(await UserFactory.create());

      const data = {
        refreshToken,
      };

      await request()
        .post(`/api/v1/auth/refresh-tokens/`)
        .send(data)
        .expect(401);
    });

    it('should respond with `401` status code when the token is blacklisted', async () => {
      const user = await UserFactory.create();
      const refreshToken = generateRefreshToken(user);
      await TokenFactory.create({
        token: refreshToken,
        type: TokenType.REFRESH,
        user: { connect: { id: user.id } },
        blacklisted: true,
      });

      const data = {
        refreshToken,
      };

      await request()
        .post(`/api/v1/auth/refresh-tokens/`)
        .send(data)
        .expect(401);
    });

    it('should respond with `401` status code when the token is invalid', async () => {
      await request()
        .post(`/api/v1/auth/refresh-tokens/`)
        .send({
          refreshToken: 'test123',
        })
        .expect(401);
    });

    it('should respond with `401` status code when the token is invalid', async () => {
      const user = await UserFactory.create();

      await request()
        .post(`/api/v1/auth/refresh-tokens/`)
        .send({
          refreshToken: generateExpiredToken(user, TokenType.REFRESH),
        })
        .expect(401);
    });

    it('should respond with `401` status code when the token type is invalid', async () => {
      const user = await UserFactory.create();
      const refreshToken = generateToken(user, TokenType.RESET_PASSWORD);
      await TokenFactory.create({
        token: refreshToken,
        type: TokenType.REFRESH,
        user: { connect: { id: user.id } },
      });

      await request()
        .post(`/api/v1/auth/refresh-tokens/`)
        .send({
          refreshToken,
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should respond with `204` status code when provided with valid email', async () => {
      await UserFactory.create({
        email: 'test@email.net',
      });

      await request()
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'test@email.net',
        })
        .expect(204);
    });

    it('should respond with `204` status code when provided with invalid email', async () => {
      await request()
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'unknown@email.net',
        })
        .expect(204);
    });

    it('should store a token for the user when successful', async () => {
      const user = await UserFactory.create({
        email: 'test@email.net',
      });

      await request()
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'test@email.net',
        })
        .expect(204);

      const count = await prisma.token.count({
        where: {
          userId: user.id,
          type: TokenType.RESET_PASSWORD,
        },
      });

      expect(count).toBe(1);
    });

    it('should send an email to the user when successful', async () => {
      await UserFactory.create({
        email: 'test@email.net',
      });

      await request()
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'test@email.net',
        })
        .expect(204);

      expect(mailer.sendMail).toBeCalledTimes(1);
      expect(mailer.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@email.net',
        }),
      );
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    type ResetPasswordContext = {
      token: string;
      user: User;
    };

    beforeEach<ResetPasswordContext>(async (context) => {
      const email = 'test@email.net';
      context.user = await UserFactory.create({ email });

      context.token = generateResetPasswordToken(context.user);

      await TokenFactory.create({
        user: {
          connect: {
            id: context.user.id,
          },
        },
        token: context.token,
        type: TokenType.RESET_PASSWORD,
        blacklisted: false,
      });
    });

    it<ResetPasswordContext>('should respond with `204` status code when provided with valid token and email', async (context) => {
      const data = {
        token: context.token,
        email: context.user.email,
        password: 'Test1234',
      };

      await request()
        .post(`/api/v1/auth/reset-password/`)
        .send(data)
        .expect(204);
    });

    it<ResetPasswordContext>('should revoke all tokens of the user', async (context) => {
      await TokenFactory.create({
        type: TokenType.REFRESH,
        user: { connect: { id: context.user.id } },
      });
      await TokenFactory.create({
        type: TokenType.RESET_PASSWORD,
        user: { connect: { id: context.user.id } },
      });

      const data = {
        token: context.token,
        email: context.user.email,
        password: 'Test1234',
      };

      await request()
        .post(`/api/v1/auth/reset-password/`)
        .send(data)
        .expect(204);

      const count = await prisma.token.count({
        where: {
          userId: context.user.id,
          blacklisted: false,
        },
      });

      expect(count).toBe(0);
    });

    it<ResetPasswordContext>('should respond with `400` status code when provided with invalid token', async (context) => {
      const data = {
        token: 'SomeInvalidToken',
        email: context.user.email,
        password: 'Test1234',
      };

      await request()
        .post(`/api/v1/auth/reset-password/`)
        .send(data)
        .expect(400);
    });

    it<ResetPasswordContext>('should respond with `400` status code when provided with expired token', async (context) => {
      const data = {
        token: generateExpiredToken(context.user, TokenType.RESET_PASSWORD),
        email: context.user.email,
        password: 'Test1234',
      };

      await request()
        .post(`/api/v1/auth/reset-password/`)
        .send(data)
        .expect(400);
    });

    it<ResetPasswordContext>('should respond with `400` status code when provided with invalid email', async (context) => {
      const data = {
        token: context.token,
        email: context.user.email,
        password: '123',
      };

      await request()
        .post(`/api/v1/auth/reset-password/`)
        .send(data)
        .expect(400);
    });

    it<ResetPasswordContext>('should respond with `400` status code when provided with invalid password', async (context) => {
      const data = {
        token: context.token,
        email: 'invalid@email.net',
        password: 'Test1234',
      };

      await request()
        .post(`/api/v1/auth/reset-password/`)
        .send(data)
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/send-verification-email', () => {
    it('should respond with `204` status code when the user is authenticated', async () => {
      const user = await UserFactory.create({
        emailVerified: false,
      });
      const token = generateSendVerifyEmailToken(user);

      await request()
        .post(`/api/v1/auth/send-verification-email/`)
        .send({ token })
        .expect(204);
    });

    it('should respond with `400` status code when the token is invalid', async () => {
      const user = await UserFactory.create({
        emailVerified: false,
      });
      const token = generateAccessToken(user);

      await request()
        .post(`/api/v1/auth/send-verification-email/`)
        .send({ token })
        .expect(400);
    });

    it('should respond with `400` status code when user does not exist anymore', async () => {
      const user = await UserFactory.create({
        emailVerified: false,
      });
      const token = generateSendVerifyEmailToken(user);
      // Delete user to simulate expired token
      await prisma.user.delete({
        where: { id: user.id },
      });

      await request()
        .post(`/api/v1/auth/send-verification-email/`)
        .send({ token })
        .expect(400);
    });

    it('should respond with `400` status code when the email is already verified', async () => {
      const user = await UserFactory.create({
        emailVerified: true,
      });
      const token = generateSendVerifyEmailToken(user);

      await request()
        .post(`/api/v1/auth/send-verification-email/`)
        .send({ token })
        .expect(400);
    });

    it('should send an email to the user when successful', async () => {
      const user = await UserFactory.create({
        emailVerified: false,
      });
      const token = generateSendVerifyEmailToken(user);

      await request()
        .post(`/api/v1/auth/send-verification-email/`)
        .send({ token })
        .expect(204);

      expect(mailer.sendMail).toBeCalledTimes(1);
      expect(mailer.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: user.email,
        }),
      );
    });
  });

  describe('POST /api/v1/auth/verify-email', () => {
    it('should respond with `204` status code when provided with valid token', async () => {
      const user = await UserFactory.create();
      const token = generateVerifyEmailToken(user);
      await TokenFactory.create({
        user: { connect: { id: user.id } },
        type: TokenType.VERIFY_EMAIL,
        token,
      });

      const data = {
        token,
      };

      await request().post(`/api/v1/auth/verify-email/`).send(data).expect(204);
    });

    it('should respond with `400` status code when provided without token', async () => {
      await request().post(`/api/v1/auth/verify-email/`).send({}).expect(400);
    });

    it('should respond with `400` status code when token is expired', async () => {
      const user = await UserFactory.create();
      const verifyToken = generateExpiredToken(user, TokenType.VERIFY_EMAIL);
      await TokenFactory.create({
        user: { connect: { id: user.id } },
        type: TokenType.VERIFY_EMAIL,
        token: verifyToken,
      });

      const data = {
        token: verifyToken,
      };

      await request().post(`/api/v1/auth/verify-email/`).send(data).expect(401);
    });

    it('should respond with `401` status code when token is invalid', async () => {
      const user = await UserFactory.create();
      await TokenFactory.create({
        user: { connect: { id: user.id } },
        type: TokenType.VERIFY_EMAIL,
        token: generateVerifyEmailToken(user),
      });

      const data = {
        token: 'test123',
      };

      await request().post(`/api/v1/auth/verify-email/`).send(data).expect(401);
    });
  });
});
