import { describe, expect, it } from 'vitest';
import { UserFactory } from '../../../prisma/factories/index.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { generateAccessToken } from './utils/token.js';

describe('/api/v1/legal/', () => {
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

  describe('GET /api/v1/legal', () => {
    it('should respond with `200` status code and both document types when unauthenticated', async () => {
      const { body } = await request().get(`/api/v1/legal/`).send().expect(200);

      expect(body.data).toHaveLength(2);
      expect(body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'IMPRINT', content: null }),
          expect.objectContaining({ type: 'PRIVACY_POLICY', content: null }),
        ]),
      );
    });

    it('should include stored content for configured documents', async () => {
      await prisma.legalDocument.create({
        data: { type: 'IMPRINT', content: 'Imprint content' },
      });

      const { body } = await request().get(`/api/v1/legal/`).send().expect(200);

      const imprint = body.data.find(
        (document: { type: string }) => document.type === 'IMPRINT',
      );
      expect(imprint.content).toBe('Imprint content');
    });
  });

  describe('GET /api/v1/legal/:type', () => {
    it('should respond with `200` status code and empty content when unconfigured', async () => {
      const { body } = await request()
        .get(`/api/v1/legal/PRIVACY_POLICY`)
        .send()
        .expect(200);

      expect(body.data).toStrictEqual({
        type: 'PRIVACY_POLICY',
        content: null,
        updatedAt: null,
      });
    });

    it('should respond with `200` status code and the stored content', async () => {
      await prisma.legalDocument.create({
        data: { type: 'IMPRINT', content: { en: 'Hello', de: 'Hallo' } },
      });

      const { body } = await request()
        .get(`/api/v1/legal/IMPRINT`)
        .send()
        .expect(200);

      expect(body.data.content).toStrictEqual({ en: 'Hello', de: 'Hallo' });
    });

    it('should respond with `400` status code for an unknown type', async () => {
      await request().get(`/api/v1/legal/NOT_A_TYPE`).send().expect(400);
    });
  });

  describe('PATCH /api/v1/legal/:type', () => {
    it('should respond with `200` status code and update the content when user is admin', async () => {
      const { accessToken } = await createAdminWithToken();

      const { body } = await request()
        .patch(`/api/v1/legal/IMPRINT`)
        .send({ content: 'Updated imprint' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.content).toBe('Updated imprint');

      const stored = await prisma.legalDocument.findUnique({
        where: { type: 'IMPRINT' },
      });
      expect(stored?.content).toBe('Updated imprint');
    });

    it('should clear the content when sent `null`', async () => {
      const { accessToken } = await createAdminWithToken();
      await prisma.legalDocument.create({
        data: { type: 'IMPRINT', content: 'Existing content' },
      });

      const { body } = await request()
        .patch(`/api/v1/legal/IMPRINT`)
        .send({ content: null })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.content).toBeNull();
    });

    it('should respond with `403` status code when user is not admin', async () => {
      const { accessToken } = await createUserWithToken();

      await request()
        .patch(`/api/v1/legal/IMPRINT`)
        .send({ content: 'Updated imprint' })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      await request()
        .patch(`/api/v1/legal/IMPRINT`)
        .send({ content: 'Updated imprint' })
        .expect(401);
    });

    it('should respond with `400` status code for an unknown type', async () => {
      const { accessToken } = await createAdminWithToken();

      await request()
        .patch(`/api/v1/legal/NOT_A_TYPE`)
        .send({ content: 'Updated imprint' })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });
  });
});
