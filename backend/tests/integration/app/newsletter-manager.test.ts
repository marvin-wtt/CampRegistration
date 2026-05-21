import { describe, expect, it } from 'vitest';
import {
  NewsletterFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { ulid } from 'ulidx';
import type { NewsletterManagerRole } from '@camp-registration/common/permissions';

const BASE = '/api/v1/newsletters';

const createNewsletterWithManager = async () => {
  const user = await UserFactory.create();
  const accessToken = generateAccessToken(user);
  const newsletter = await NewsletterFactory.create({
    managers: { create: { userId: user.id, role: 'OWNER' } },
  });
  return { user, accessToken, newsletter };
};

const createNewsletterWithRole = async (role: NewsletterManagerRole) => {
  const user = await UserFactory.create();
  const accessToken = generateAccessToken(user);
  const newsletter = await NewsletterFactory.create({
    managers: { create: { userId: user.id, role } },
  });
  return { accessToken, newsletter };
};

describe(`${BASE}/:newsletterId/managers`, () => {
  describe(`GET ${BASE}/:newsletterId/managers`, () => {
    it('should respond with `200` and the list of managers', async () => {
      const { user, accessToken, newsletter } =
        await createNewsletterWithManager();

      const { body } = await request()
        .get(`${BASE}/${newsletter.id}/managers`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toMatchObject({
        id: expect.any(String),
        email: user.email,
        name: user.name,
        role: 'OWNER',
      });
    });

    it('should return all managers for the newsletter', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      const secondUser = await UserFactory.create();
      await prisma.newsletterManager.create({
        data: { newsletterId: newsletter.id, userId: secondUser.id },
      });

      const { body } = await request()
        .get(`${BASE}/${newsletter.id}/managers`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toHaveLength(2);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const newsletter = await NewsletterFactory.create();

      await request().get(`${BASE}/${newsletter.id}/managers`).expect(401);
    });

    it('should respond with `403` when user is not a manager', async () => {
      const newsletter = await NewsletterFactory.create();
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .get(`${BASE}/${newsletter.id}/managers`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `404` when newsletter does not exist', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .get(`${BASE}/${ulid()}/managers`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it.each([
      ['OWNER', 200],
      ['EDITOR', 200],
      ['VIEWER', 403],
    ] as const)('role %s → %i', async (role, status) => {
      const { accessToken, newsletter } = await createNewsletterWithRole(role);
      await request()
        .get(`${BASE}/${newsletter.id}/managers`)
        .auth(accessToken, { type: 'bearer' })
        .expect(status);
    });
  });

  describe(`POST ${BASE}/:newsletterId/managers`, () => {
    it('should respond with `201` and add the user as a manager', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      const newManager = await UserFactory.create();

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/managers`)
        .send({ email: newManager.email })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data).toMatchObject({
        id: expect.any(String),
        email: newManager.email,
        name: newManager.name,
        role: 'EDITOR',
      });

      const record = await prisma.newsletterManager.findFirst({
        where: { newsletterId: newsletter.id, userId: newManager.id },
      });
      expect(record).not.toBeNull();
      expect(record?.role).toBe('EDITOR');
    });

    it('should add manager with specified role when role is provided', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      const newManager = await UserFactory.create();

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/managers`)
        .send({ email: newManager.email, role: 'VIEWER' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data).toMatchObject({ role: 'VIEWER' });
    });

    it('should respond with `400` when user is already a manager', async () => {
      const { user, accessToken, newsletter } =
        await createNewsletterWithManager();

      await request()
        .post(`${BASE}/${newsletter.id}/managers`)
        .send({ email: user.email })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `400` when no user exists with that email', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await request()
        .post(`${BASE}/${newsletter.id}/managers`)
        .send({ email: 'nonexistent@example.com' })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `400` when email is invalid', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await request()
        .post(`${BASE}/${newsletter.id}/managers`)
        .send({ email: 'not-an-email' })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `400` when email is missing', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await request()
        .post(`${BASE}/${newsletter.id}/managers`)
        .send({})
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const newsletter = await NewsletterFactory.create();

      await request()
        .post(`${BASE}/${newsletter.id}/managers`)
        .send({ email: 'test@example.com' })
        .expect(401);
    });

    it('should respond with `403` when user is not a manager', async () => {
      const newsletter = await NewsletterFactory.create();
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);
      const target = await UserFactory.create();

      await request()
        .post(`${BASE}/${newsletter.id}/managers`)
        .send({ email: target.email })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `404` when newsletter does not exist', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);
      const target = await UserFactory.create();

      await request()
        .post(`${BASE}/${ulid()}/managers`)
        .send({ email: target.email })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it.each([
      ['OWNER', 201],
      ['EDITOR', 403],
      ['VIEWER', 403],
    ] as const)('role %s → %i', async (role, status) => {
      const { accessToken, newsletter } = await createNewsletterWithRole(role);
      const newUser = await UserFactory.create();
      await request()
        .post(`${BASE}/${newsletter.id}/managers`)
        .send({ email: newUser.email })
        .auth(accessToken, { type: 'bearer' })
        .expect(status);
    });
  });

  describe(`DELETE ${BASE}/:newsletterId/managers/:newsletterManagerId`, () => {
    it('should respond with `204` and remove the manager', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      const secondUser = await UserFactory.create();
      const secondManager = await prisma.newsletterManager.create({
        data: {
          newsletterId: newsletter.id,
          userId: secondUser.id,
          role: 'EDITOR',
        },
      });

      await request()
        .delete(`${BASE}/${newsletter.id}/managers/${secondManager.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      const deleted = await prisma.newsletterManager.findUnique({
        where: { id: secondManager.id },
      });
      expect(deleted).toBeNull();
    });

    it('should respond with `400` when trying to remove the last owner', async () => {
      const { user, accessToken, newsletter } =
        await createNewsletterWithManager();

      const manager = await prisma.newsletterManager.findFirstOrThrow({
        where: { newsletterId: newsletter.id, userId: user.id },
      });

      await request()
        .delete(`${BASE}/${newsletter.id}/managers/${manager.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `400` when removing the last owner even if other managers exist', async () => {
      const { user, accessToken, newsletter } =
        await createNewsletterWithManager();

      const editorUser = await UserFactory.create();
      await prisma.newsletterManager.create({
        data: {
          newsletterId: newsletter.id,
          userId: editorUser.id,
          role: 'EDITOR',
        },
      });

      const ownerManager = await prisma.newsletterManager.findFirstOrThrow({
        where: { newsletterId: newsletter.id, userId: user.id },
      });

      await request()
        .delete(`${BASE}/${newsletter.id}/managers/${ownerManager.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `204` when removing an owner if another owner remains', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      const secondOwnerUser = await UserFactory.create();
      const secondOwner = await prisma.newsletterManager.create({
        data: {
          newsletterId: newsletter.id,
          userId: secondOwnerUser.id,
          role: 'OWNER',
        },
      });

      await request()
        .delete(`${BASE}/${newsletter.id}/managers/${secondOwner.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(204);
    });

    it('should respond with `404` when newsletter does not exist', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .delete(`${BASE}/${ulid()}/managers/${ulid()}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `404` when manager does not exist', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await request()
        .delete(`${BASE}/${newsletter.id}/managers/${ulid()}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `404` when manager belongs to a different newsletter', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      const otherUser = await UserFactory.create();
      const otherNewsletter = await NewsletterFactory.create({
        managers: { create: { userId: otherUser.id, role: 'OWNER' } },
      });
      const otherManager = await prisma.newsletterManager.findFirstOrThrow({
        where: { newsletterId: otherNewsletter.id },
      });

      await request()
        .delete(`${BASE}/${newsletter.id}/managers/${otherManager.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const newsletter = await NewsletterFactory.create();

      await request()
        .delete(`${BASE}/${newsletter.id}/managers/${ulid()}`)
        .expect(401);
    });

    it('should respond with `403` when user is not a manager', async () => {
      const newsletter = await NewsletterFactory.create();
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .delete(`${BASE}/${newsletter.id}/managers/${ulid()}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it.each([
      ['OWNER', 204],
      ['EDITOR', 403],
      ['VIEWER', 403],
    ] as const)('role %s → %i', async (role, status) => {
      const { accessToken, newsletter } = await createNewsletterWithRole(role);
      const targetUser = await UserFactory.create();
      const targetManager = await prisma.newsletterManager.create({
        data: {
          newsletterId: newsletter.id,
          userId: targetUser.id,
          role: 'EDITOR',
        },
      });
      await request()
        .delete(`${BASE}/${newsletter.id}/managers/${targetManager.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(status);
    });
  });
});
