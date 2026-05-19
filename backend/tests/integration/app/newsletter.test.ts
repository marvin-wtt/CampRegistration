import { describe, expect, it } from 'vitest';
import {
  NewsletterFactory,
  NewsletterSubscriberFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { ulid } from 'ulidx';

const BASE = '/api/v1/newsletters';

const createNewsletterWithManager = async () => {
  const user = await UserFactory.create();
  const accessToken = generateAccessToken(user);
  const newsletter = await NewsletterFactory.create({
    managers: { create: { userId: user.id } },
  });
  return { user, accessToken, newsletter };
};

describe(BASE, () => {
  describe(`GET ${BASE}`, () => {
    it('should respond with `200` and only the newsletters managed by the user', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      // Another newsletter not managed by this user
      await NewsletterFactory.create();

      const { body } = await request()
        .get(BASE)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe(newsletter.id);
    });

    it('should respond with `200` and an empty array when the user has no newsletters', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      const { body } = await request()
        .get(BASE)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toEqual([]);
    });

    it('should respond with `200` and all the newsletters for administrator', async () => {
      const user = await UserFactory.create({
        role: 'ADMIN',
      });
      const accessToken = generateAccessToken(user);

      await NewsletterFactory.create();

      const { body } = await request()
        .get(`${BASE}?view=all`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toHaveLength(1);
    });

    it('should respond with `403` when requesting view=all', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .get(`${BASE}?view=all`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` when unauthenticated', async () => {
      await request().get(BASE).expect(401);
    });
  });

  describe(`POST ${BASE}`, () => {
    it('should respond with `201` and the created newsletter', async () => {
      const user = await UserFactory.create({
        role: 'ADMIN',
      });
      const accessToken = generateAccessToken(user);

      const { body } = await request()
        .post(BASE)
        .send({ name: 'My Newsletter', description: 'A description' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data).toMatchObject({
        id: expect.any(String),
        name: 'My Newsletter',
        description: 'A description',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      // replyTo is null when not provided
      expect(body.data.replyTo).toBeNull();
    });

    it('should respond with `201` and include replyTo when provided', async () => {
      const user = await UserFactory.create({
        role: 'ADMIN',
      });
      const accessToken = generateAccessToken(user);

      const { body } = await request()
        .post(BASE)
        .send({ name: 'Newsletter With Reply', replyTo: 'reply@example.com' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data.replyTo).toBe('reply@example.com');
    });

    it('should automatically add the creating user as manager', async () => {
      const user = await UserFactory.create({
        role: 'ADMIN',
      });
      const accessToken = generateAccessToken(user);

      const { body } = await request()
        .post(BASE)
        .send({ name: 'My Newsletter' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      const manager = await prisma.newsletterManager.findFirst({
        where: { newsletterId: body.data.id, userId: user.id },
      });
      expect(manager).not.toBeNull();
    });

    it('should accept a null description', async () => {
      const user = await UserFactory.create({
        role: 'ADMIN',
      });
      const accessToken = generateAccessToken(user);

      const { body } = await request()
        .post(BASE)
        .send({ name: 'My Newsletter', description: null })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data.description).toBeNull();
    });

    it('should respond with `400` when name is missing', async () => {
      const user = await UserFactory.create({
        role: 'ADMIN',
      });
      const accessToken = generateAccessToken(user);

      await request()
        .post(BASE)
        .send({ description: 'No name' })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `401` when unauthenticated', async () => {
      await request().post(BASE).send({ name: 'Test' }).expect(401);
    });

    it('should respond with `401` when not an admin', async () => {
      const user = await UserFactory.create({
        role: 'ADMIN',
      });
      const accessToken = generateAccessToken(user);

      await request()
        .post(BASE)
        .send({ name: 'My Newsletter', description: null })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });
  });

  describe(`GET ${BASE}/:newsletterId`, () => {
    it('should respond with `200` and the newsletter data', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const { body } = await request()
        .get(`${BASE}/${newsletter.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toMatchObject({
        id: newsletter.id,
        name: newsletter.name,
        description: newsletter.description,
      });
    });

    it('should respond with `401` when unauthenticated', async () => {
      const newsletter = await NewsletterFactory.create();

      await request().get(`${BASE}/${newsletter.id}`).expect(401);
    });

    it('should respond with `403` when user is not a manager', async () => {
      const newsletter = await NewsletterFactory.create();
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .get(`${BASE}/${newsletter.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `404` when newsletter does not exist', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .get(`${BASE}/${ulid()}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe(`PATCH ${BASE}/:newsletterId`, () => {
    it('should respond with `200` and the updated newsletter', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const { body } = await request()
        .patch(`${BASE}/${newsletter.id}`)
        .send({ name: 'Updated Name', description: 'New description' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toMatchObject({
        id: newsletter.id,
        name: 'Updated Name',
        description: 'New description',
      });
    });

    it('should allow partial update with only name', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const { body } = await request()
        .patch(`${BASE}/${newsletter.id}`)
        .send({ name: 'Partial Update' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.name).toBe('Partial Update');
    });

    it('should return non-null updatedAt after update', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const { body } = await request()
        .patch(`${BASE}/${newsletter.id}`)
        .send({ name: 'Updated For Timestamp' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.updatedAt).not.toBeNull();
      expect(body.data.updatedAt).toEqual(expect.any(String));
    });

    it('should allow updating replyTo to a non-null value', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const { body } = await request()
        .patch(`${BASE}/${newsletter.id}`)
        .send({ replyTo: 'updated-reply@example.com' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.replyTo).toBe('updated-reply@example.com');
    });

    it('should allow clearing replyTo to null', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const { body } = await request()
        .patch(`${BASE}/${newsletter.id}`)
        .send({ replyTo: null })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.replyTo).toBeNull();
    });

    it('should allow clearing description to null', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const { body } = await request()
        .patch(`${BASE}/${newsletter.id}`)
        .send({ description: null })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.description).toBeNull();
    });

    it('should respond with `401` when unauthenticated', async () => {
      const newsletter = await NewsletterFactory.create();

      await request()
        .patch(`${BASE}/${newsletter.id}`)
        .send({ name: 'Updated' })
        .expect(401);
    });

    it('should respond with `403` when user is not a manager', async () => {
      const newsletter = await NewsletterFactory.create();
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .patch(`${BASE}/${newsletter.id}`)
        .send({ name: 'Updated' })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `404` when newsletter does not exist', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .patch(`${BASE}/${ulid()}`)
        .send({ name: 'Updated' })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe(`DELETE ${BASE}/:newsletterId`, () => {
    it('should respond with `204` and delete the newsletter', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await request()
        .delete(`${BASE}/${newsletter.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      const deleted = await prisma.newsletter.findUnique({
        where: { id: newsletter.id },
      });
      expect(deleted).toBeNull();
    });

    it('should cascade-delete related managers and subscribers', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
      });

      await request()
        .delete(`${BASE}/${newsletter.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      const managers = await prisma.newsletterManager.findMany({
        where: { newsletterId: newsletter.id },
      });
      const subscribers = await prisma.newsletterSubscriber.findMany({
        where: { newsletterId: newsletter.id },
      });
      expect(managers).toHaveLength(0);
      expect(subscribers).toHaveLength(0);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const newsletter = await NewsletterFactory.create();

      await request().delete(`${BASE}/${newsletter.id}`).expect(401);
    });

    it('should respond with `403` when user is not a manager', async () => {
      const newsletter = await NewsletterFactory.create();
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .delete(`${BASE}/${newsletter.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `404` when newsletter does not exist', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .delete(`${BASE}/${ulid()}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });
});
