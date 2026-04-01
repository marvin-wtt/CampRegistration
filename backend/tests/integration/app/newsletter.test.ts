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
  // ---------------------------------------------------------------------------
  // GET /api/v1/newsletters
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // POST /api/v1/newsletters
  // ---------------------------------------------------------------------------
  describe(`POST ${BASE}`, () => {
    it('should respond with `201` and the created newsletter', async () => {
      const user = await UserFactory.create();
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
        updatedAt: null,
      });
    });

    it('should automatically add the creating user as manager', async () => {
      const user = await UserFactory.create();
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
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      const { body } = await request()
        .post(BASE)
        .send({ name: 'My Newsletter', description: null })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data.description).toBeNull();
    });

    it('should respond with `422` when name is missing', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .post(BASE)
        .send({ description: 'No name' })
        .auth(accessToken, { type: 'bearer' })
        .expect(422);
    });

    it('should respond with `401` when unauthenticated', async () => {
      await request().post(BASE).send({ name: 'Test' }).expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/v1/newsletters/:newsletterId
  // ---------------------------------------------------------------------------
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

    it('should respond with `422` when newsletterId is not a valid ULID', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .get(`${BASE}/not-a-ulid`)
        .auth(accessToken, { type: 'bearer' })
        .expect(422);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /api/v1/newsletters/:newsletterId
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // DELETE /api/v1/newsletters/:newsletterId
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // POST /api/v1/newsletters/:newsletterId/send
  // ---------------------------------------------------------------------------
  describe(`POST ${BASE}/:newsletterId/send`, () => {
    it('should respond with `200` and the queued recipient count', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
      });
      await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
      });

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/send`)
        .send({ subject: 'Hello', body: '<p>World</p>' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toEqual({ queued: 2 });
    });

    it('should record a message in the newsletter history', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
      });

      await request()
        .post(`${BASE}/${newsletter.id}/send`)
        .send({ subject: 'Test Subject', body: '<p>Test Body</p>' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const message = await prisma.newsletterMessage.findFirst({
        where: { newsletterId: newsletter.id },
      });
      expect(message).not.toBeNull();
      expect(message?.subject).toBe('Test Subject');
      expect(message?.body).toBe('<p>Test Body</p>');
      expect(message?.recipientCount).toBe(1);
    });

    it('should respond with `200` and queued=0 when there are no subscribers', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/send`)
        .send({ subject: 'Hello', body: '<p>World</p>' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toEqual({ queued: 0 });
    });

    it('should respond with `422` when subject is missing', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await request()
        .post(`${BASE}/${newsletter.id}/send`)
        .send({ body: '<p>No subject</p>' })
        .auth(accessToken, { type: 'bearer' })
        .expect(422);
    });

    it('should respond with `422` when body is missing', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await request()
        .post(`${BASE}/${newsletter.id}/send`)
        .send({ subject: 'No body' })
        .auth(accessToken, { type: 'bearer' })
        .expect(422);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const newsletter = await NewsletterFactory.create();

      await request()
        .post(`${BASE}/${newsletter.id}/send`)
        .send({ subject: 'Hello', body: '<p>World</p>' })
        .expect(401);
    });

    it('should respond with `403` when user is not a manager', async () => {
      const newsletter = await NewsletterFactory.create();
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .post(`${BASE}/${newsletter.id}/send`)
        .send({ subject: 'Hello', body: '<p>World</p>' })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `404` when newsletter does not exist', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .post(`${BASE}/${ulid()}/send`)
        .send({ subject: 'Hello', body: '<p>World</p>' })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });
});
