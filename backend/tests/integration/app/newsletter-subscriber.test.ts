import { describe, expect, it } from 'vitest';
import {
  CampFactory,
  NewsletterFactory,
  NewsletterSubscriberFactory,
  RegistrationFactory,
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

describe(`${BASE}/:newsletterId/subscribers`, () => {
  describe(`GET ${BASE}/:newsletterId/subscribers`, () => {
    it('should respond with `200` and an empty array when there are no subscribers', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const { body } = await request()
        .get(`${BASE}/${newsletter.id}/subscribers`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toEqual([]);
    });

    it('should respond with `200` and the list of subscribers with correct shape', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const subscriber = await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
        email: 'test@example.com',
        name: 'Test User',
        country: 'de',
      });

      const { body } = await request()
        .get(`${BASE}/${newsletter.id}/subscribers`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toMatchObject({
        id: subscriber.id,
        email: 'test@example.com',
        name: 'Test User',
        country: 'de',
        subscribedAt: expect.any(String),
      });
    });

    it('should return subscribers ordered by subscribedAt descending', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const first = await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
        subscribedAt: new Date('2024-01-01T10:00:00Z'),
      });
      const second = await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
        subscribedAt: new Date('2024-06-01T10:00:00Z'),
      });

      const { body } = await request()
        .get(`${BASE}/${newsletter.id}/subscribers`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data[0].id).toBe(second.id);
      expect(body.data[1].id).toBe(first.id);
    });

    it('should only return subscribers belonging to the requested newsletter', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const otherNewsletter = await NewsletterFactory.create();
      await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: otherNewsletter.id } },
      });
      const ownSubscriber = await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
      });

      const { body } = await request()
        .get(`${BASE}/${newsletter.id}/subscribers`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe(ownSubscriber.id);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const newsletter = await NewsletterFactory.create();

      await request().get(`${BASE}/${newsletter.id}/subscribers`).expect(401);
    });

    it('should respond with `403` when user is not a manager', async () => {
      const newsletter = await NewsletterFactory.create();
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .get(`${BASE}/${newsletter.id}/subscribers`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `404` when newsletter does not exist', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .get(`${BASE}/${ulid()}/subscribers`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe(`POST ${BASE}/:newsletterId/subscribers`, () => {
    it('should respond with `201` and the created subscriber', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/subscribers`)
        .send({ email: 'new@example.com', name: 'New Person' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data).toMatchObject({
        id: expect.any(String),
        email: 'new@example.com',
        name: 'New Person',
        subscribedAt: expect.any(String),
      });
    });

    it('should accept a subscriber without name', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/subscribers`)
        .send({ email: 'noname@example.com' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data.name).toBeNull();
    });

    it('should persist the subscriber in the database', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers`)
        .send({ email: 'persist@example.com' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      const record = await prisma.newsletterSubscriber.findFirst({
        where: { newsletterId: newsletter.id, email: 'persist@example.com' },
      });
      expect(record).not.toBeNull();
    });

    it('should respond with `400` when email is already subscribed', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
        email: 'dup@example.com',
      });

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers`)
        .send({ email: 'dup@example.com' })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `422` when email is invalid', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers`)
        .send({ email: 'not-an-email' })
        .auth(accessToken, { type: 'bearer' })
        .expect(422);
    });

    it('should respond with `422` when email is missing', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers`)
        .send({ name: 'No email' })
        .auth(accessToken, { type: 'bearer' })
        .expect(422);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const newsletter = await NewsletterFactory.create();

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers`)
        .send({ email: 'test@example.com' })
        .expect(401);
    });

    it('should respond with `403` when user is not a manager', async () => {
      const newsletter = await NewsletterFactory.create();
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers`)
        .send({ email: 'test@example.com' })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `404` when newsletter does not exist', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .post(`${BASE}/${ulid()}/subscribers`)
        .send({ email: 'test@example.com' })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe(`POST ${BASE}/:newsletterId/subscribers/import`, () => {
    it('should respond with `200` and import registrations with emails', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      const camp = await CampFactory.create();
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        emails: ['import1@example.com'],
      });
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        emails: ['import2@example.com'],
      });

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ campId: camp.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toEqual({ added: 2, skipped: 0 });

      const count = await prisma.newsletterSubscriber.count({
        where: { newsletterId: newsletter.id },
      });
      expect(count).toBe(2);
    });

    it('should skip registrations without an email', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      const camp = await CampFactory.create();
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        emails: [],
      });

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ campId: camp.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toEqual({ added: 0, skipped: 0 });
    });

    it('should skip already-subscribed emails and report them as skipped', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      const camp = await CampFactory.create();
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        emails: ['existing@example.com'],
      });
      await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
        email: 'existing@example.com',
      });

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ campId: camp.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toEqual({ added: 0, skipped: 1 });
    });

    it('should filter by country when provided', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      const camp = await CampFactory.create();
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        emails: ['de@example.com'],
        country: 'de',
      });
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        emails: ['fr@example.com'],
        country: 'fr',
      });

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ campId: camp.id, country: 'de' })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toEqual({ added: 1, skipped: 0 });

      const subscriber = await prisma.newsletterSubscriber.findFirst({
        where: { newsletterId: newsletter.id },
      });
      expect(subscriber?.email).toBe('de@example.com');
    });

    it('should respond with `422` when campId is missing', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({})
        .auth(accessToken, { type: 'bearer' })
        .expect(422);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const newsletter = await NewsletterFactory.create();

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ campId: ulid() })
        .expect(401);
    });

    it('should respond with `403` when user is not a manager', async () => {
      const newsletter = await NewsletterFactory.create();
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ campId: ulid() })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });
  });

  describe(`DELETE ${BASE}/:newsletterId/subscribers/:newsLetterSubscriberId`, () => {
    it('should respond with `204` and delete the subscriber', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      const subscriber = await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
      });

      await request()
        .delete(`${BASE}/${newsletter.id}/subscribers/${subscriber.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      const deleted = await prisma.newsletterSubscriber.findUnique({
        where: { id: subscriber.id },
      });
      expect(deleted).toBeNull();
    });

    it('should respond with `404` when subscriber does not exist', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await request()
        .delete(`${BASE}/${newsletter.id}/subscribers/${ulid()}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `404` when subscriber belongs to a different newsletter', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      const otherNewsletter = await NewsletterFactory.create();
      const otherSubscriber = await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: otherNewsletter.id } },
      });

      await request()
        .delete(`${BASE}/${newsletter.id}/subscribers/${otherSubscriber.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);

      const still = await prisma.newsletterSubscriber.findUnique({
        where: { id: otherSubscriber.id },
      });
      expect(still).not.toBeNull();
    });

    it('should respond with `401` when unauthenticated', async () => {
      const newsletter = await NewsletterFactory.create();
      const subscriber = await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
      });

      await request()
        .delete(`${BASE}/${newsletter.id}/subscribers/${subscriber.id}`)
        .expect(401);
    });

    it('should respond with `403` when user is not a manager', async () => {
      const newsletter = await NewsletterFactory.create();
      const subscriber = await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
      });
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .delete(`${BASE}/${newsletter.id}/subscribers/${subscriber.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `422` when newsLetterSubscriberId is not a valid ULID', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await request()
        .delete(`${BASE}/${newsletter.id}/subscribers/not-a-ulid`)
        .auth(accessToken, { type: 'bearer' })
        .expect(422);
    });
  });
});
