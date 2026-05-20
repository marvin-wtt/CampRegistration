import { describe, expect, it } from 'vitest';
import {
  CampFactory,
  CampManagerFactory,
  NewsletterFactory,
  NewsletterSubscriberFactory,
  RegistrationFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { ulid } from 'ulidx';
import { Prisma } from '#generated/prisma/client';

const BASE = '/api/v1/newsletters';

const createNewsletterWithManager = async () => {
  const user = await UserFactory.create();
  const accessToken = generateAccessToken(user);
  const newsletter = await NewsletterFactory.create({
    managers: { create: { userId: user.id } },
  });
  return { user, accessToken, newsletter };
};

const createNewsletterAndCampWithManager = async () => {
  const { user, accessToken, newsletter } = await createNewsletterWithManager();
  const camp = await CampFactory.create();
  await CampManagerFactory.create({
    camp: { connect: { id: camp.id } },
    user: { connect: { id: user.id } },
  });
  return { user, accessToken, newsletter, camp };
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
        subscribedAt: expect.any(String),
      });
    });

    it('should return subscriber with null name when name is not set', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
        email: 'noname@example.com',
        name: null,
      });

      const { body } = await request()
        .get(`${BASE}/${newsletter.id}/subscribers`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data[0].name).toBeNull();
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

    it('should accept a subscriber with explicit null name', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/subscribers`)
        .send({ email: 'nullname@example.com', name: null })
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

    it('should respond with `400` when email is invalid', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers`)
        .send({ email: 'not-an-email' })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `400` when email is missing', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers`)
        .send({ name: 'No email' })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
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
      const { accessToken, newsletter, camp } =
        await createNewsletterAndCampWithManager();
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

    it('should skip registrations without an email (empty array)', async () => {
      const { accessToken, newsletter, camp } =
        await createNewsletterAndCampWithManager();
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

    it('should skip registrations where emails field is null', async () => {
      const { accessToken, newsletter, camp } =
        await createNewsletterAndCampWithManager();
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        emails: Prisma.DbNull,
      });

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ campId: camp.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toEqual({ added: 0, skipped: 0 });
    });

    it('should skip null/empty individual emails within an emails array', async () => {
      const { accessToken, newsletter, camp } =
        await createNewsletterAndCampWithManager();
      // emails array contains a falsy value
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        emails: ['', 'valid@example.com'],
      });

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ campId: camp.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      // The empty string is skipped, only valid email is added
      expect(body.data).toEqual({ added: 1, skipped: 0 });
    });

    it('should deduplicate emails that appear in multiple registrations', async () => {
      const { accessToken, newsletter, camp } =
        await createNewsletterAndCampWithManager();
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        emails: ['shared@example.com'],
      });
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        emails: ['shared@example.com'],
      });

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ campId: camp.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      // shared@example.com is deduplicated in candidates, so added=1, skipped=0
      expect(body.data).toEqual({ added: 1, skipped: 0 });

      const count = await prisma.newsletterSubscriber.count({
        where: { newsletterId: newsletter.id },
      });
      expect(count).toBe(1);
    });

    it('should skip already-subscribed emails and report them as skipped', async () => {
      const { accessToken, newsletter, camp } =
        await createNewsletterAndCampWithManager();
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
      const { accessToken, newsletter, camp } =
        await createNewsletterAndCampWithManager();
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

    it('should import all registrations regardless of consent when requireConsent is false', async () => {
      const { accessToken, newsletter, camp } =
        await createNewsletterAndCampWithManager();
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        emails: ['consent-true@example.com'],
        newsletterConsent: true,
      });
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        emails: ['consent-null@example.com'],
        newsletterConsent: null,
      });

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ campId: camp.id, requireConsent: false })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      // requireConsent=false uses `{ not: false }`, so true and null both pass
      expect(body.data.added).toBe(2);
    });

    it('should only import registrations with explicit consent when requireConsent is true', async () => {
      const { accessToken, newsletter, camp } =
        await createNewsletterAndCampWithManager();
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        emails: ['consent-true@example.com'],
        newsletterConsent: true,
      });
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        emails: ['consent-false@example.com'],
        newsletterConsent: false,
      });
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        emails: ['consent-null@example.com'],
        newsletterConsent: null,
      });

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ campId: camp.id, requireConsent: true })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      // requireConsent=true uses `newsletterConsent: true`, so only the explicit true passes
      expect(body.data.added).toBe(1);

      const subscriber = await prisma.newsletterSubscriber.findFirst({
        where: { newsletterId: newsletter.id },
      });
      expect(subscriber?.email).toBe('consent-true@example.com');
    });

    it('should set subscriber name from firstName and lastName', async () => {
      const { accessToken, newsletter, camp } =
        await createNewsletterAndCampWithManager();
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        emails: ['named@example.com'],
        firstName: 'Alice',
        lastName: 'Smith',
      });

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ campId: camp.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const subscriber = await prisma.newsletterSubscriber.findFirst({
        where: { newsletterId: newsletter.id, email: 'named@example.com' },
      });
      expect(subscriber?.name).toBe('Alice Smith');
    });

    it('should set subscriber name from firstName only when lastName is missing', async () => {
      const { accessToken, newsletter, camp } =
        await createNewsletterAndCampWithManager();
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        emails: ['firstonly@example.com'],
        firstName: 'Bob',
        lastName: null,
      });

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ campId: camp.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const subscriber = await prisma.newsletterSubscriber.findFirst({
        where: { newsletterId: newsletter.id, email: 'firstonly@example.com' },
      });
      expect(subscriber?.name).toBe('Bob');
    });

    it('should set subscriber name from lastName only when firstName is missing', async () => {
      const { accessToken, newsletter, camp } =
        await createNewsletterAndCampWithManager();
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        emails: ['lastonly@example.com'],
        firstName: null,
        lastName: 'Jones',
      });

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ campId: camp.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const subscriber = await prisma.newsletterSubscriber.findFirst({
        where: { newsletterId: newsletter.id, email: 'lastonly@example.com' },
      });
      expect(subscriber?.name).toBe('Jones');
    });

    it('should set subscriber name to null when both firstName and lastName are missing', async () => {
      const { accessToken, newsletter, camp } =
        await createNewsletterAndCampWithManager();
      await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
        emails: ['noname@example.com'],
        firstName: null,
        lastName: null,
      });

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ campId: camp.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const subscriber = await prisma.newsletterSubscriber.findFirst({
        where: { newsletterId: newsletter.id, email: 'noname@example.com' },
      });
      expect(subscriber?.name).toBeNull();
    });

    it('should respond with `400` when campId is missing', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({})
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const newsletter = await NewsletterFactory.create();

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ campId: ulid() })
        .expect(401);
    });

    it('should respond with `403` when user is not a newsletter manager', async () => {
      const newsletter = await NewsletterFactory.create();
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ campId: ulid() })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `403` when user is a newsletter manager but not a camp manager', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      const camp = await CampFactory.create();

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ campId: camp.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });
  });

  describe(`DELETE ${BASE}/:newsletterId/subscribers/:newsletterSubscriberId`, () => {
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
  });
});

describe('/api/v1/newsletters/unsubscribe', () => {
  describe('DELETE /api/v1/newsletters/unsubscribe/:token', () => {
    it('should respond with `204` and remove the subscriber when token is valid', async () => {
      const newsletter = await NewsletterFactory.create();
      const token = 'a'.repeat(64);
      const subscriber = await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
        unsubscribeToken: token,
      });

      await request()
        .delete(`/api/v1/newsletters/unsubscribe/${token}`)
        .expect(204);

      const deleted = await prisma.newsletterSubscriber.findUnique({
        where: { id: subscriber.id },
      });
      expect(deleted).toBeNull();
    });

    it('should respond with `404` when the token does not match any subscriber', async () => {
      const token = 'b'.repeat(64);

      await request()
        .delete(`/api/v1/newsletters/unsubscribe/${token}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/newsletters/unsubscribe/:token', () => {
    it('should respond with `204` and remove the subscriber when token is valid', async () => {
      const newsletter = await NewsletterFactory.create();
      const token = 'a'.repeat(64);
      const subscriber = await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
        unsubscribeToken: token,
      });

      await request()
        .post(`/api/v1/newsletters/unsubscribe/${token}`)
        .expect(204);

      const deleted = await prisma.newsletterSubscriber.findUnique({
        where: { id: subscriber.id },
      });
      expect(deleted).toBeNull();
    });

    it('should respond with `404` when the token does not match any subscriber', async () => {
      const token = 'b'.repeat(64);

      await request()
        .post(`/api/v1/newsletters/unsubscribe/${token}`)
        .expect(404);
    });
  });
});
