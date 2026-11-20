import { describe, expect, it, vi } from 'vitest';
import {
  EventFactory,
  EventManagerFactory,
  NewsletterFactory,
  NewsletterSubscriberFactory,
  OrganizationFactory,
  RegistrationFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { expectEmailCount, expectEmailWith, mailer } from '../utils/mail.js';
import { resolve } from '#core/ioc/container';
import { NewsletterSubscriberService } from '#app/newsletterSubscriber/newsletter-subscriber.service';

const BASE = '/api/v1/newsletters';
const DAY = 24 * 60 * 60 * 1000;

const createNewsletterWithManager = async (
  verificationStatus: 'VERIFIED' | 'PENDING' = 'VERIFIED',
) => {
  const user = await UserFactory.create({ locale: 'de-DE' });
  const accessToken = generateAccessToken(user);
  const newsletter = await NewsletterFactory.create({
    name: 'Summer News',
    organization: {
      create: OrganizationFactory.build({ verificationStatus }),
    },
    managers: { create: { userId: user.id, role: 'OWNER' } },
  });
  return { user, accessToken, newsletter };
};

const sentMailText = (): string => {
  const calls = vi.mocked(mailer.sendMail).mock.calls;
  return calls.map(([mail]) => String(mail.html)).join('\n');
};

describe('newsletter double opt-in', () => {
  describe(`POST ${BASE}/:newsletterId/subscribers`, () => {
    it('should create a pending subscriber and send a confirmation', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/subscribers`)
        .send({ email: 'new@example.com', consentConfirmed: true })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data).toMatchObject({
        status: 'pending',
        confirmedAt: null,
        consentedAt: expect.any(String),
        confirmationSentAt: expect.any(String),
      });

      const record = await prisma.newsletterSubscriber.findUniqueOrThrow({
        where: { id: body.data.id },
      });
      expect(record.locale).toBe('de-DE');
      expect(record.confirmationToken).toHaveLength(64);

      expectEmailCount(1);
      expectEmailWith({ to: 'new@example.com' });
      expect(sentMailText()).toContain(
        `newsletters/confirm/${record.confirmationToken}`,
      );
    });

    it('should store the given consent date', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/subscribers`)
        .send({
          email: 'dated@example.com',
          consentConfirmed: true,
          consentedAt: '2026-03-01',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data.consentedAt).toBe('2026-03-01T00:00:00.000Z');
    });

    it('should respond with `400` when the consent date is in the future', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers`)
        .send({
          email: 'future@example.com',
          consentConfirmed: true,
          consentedAt: new Date(Date.now() + 2 * DAY).toISOString(),
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `403` when the organization is not verified', async () => {
      const { accessToken, newsletter } =
        await createNewsletterWithManager('PENDING');

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers`)
        .send({ email: 'new@example.com', consentConfirmed: true })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      expect(mailer.sendMail).not.toHaveBeenCalled();
    });
  });

  describe(`POST ${BASE}/:newsletterId/subscribers/import`, () => {
    const setup = async (verificationStatus?: 'VERIFIED' | 'PENDING') => {
      const context = await createNewsletterWithManager(verificationStatus);
      const event = await EventFactory.create();
      await EventManagerFactory.create({
        event: { connect: { id: event.id } },
        user: { connect: { id: context.user.id } },
      });
      return { ...context, event };
    };

    it('should add pending subscribers with the registration as consent', async () => {
      const { accessToken, newsletter, event } = await setup();
      const createdAt = new Date('2026-02-01T10:00:00Z');
      await RegistrationFactory.create({
        event: { connect: { id: event.id } },
        newsletterConsent: true,
        emails: ['import@example.com'],
        locale: 'fr-FR',
        createdAt,
      });

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ eventId: event.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const record = await prisma.newsletterSubscriber.findFirstOrThrow({
        where: { newsletterId: newsletter.id },
      });
      expect(record.confirmedAt).toBeNull();
      expect(record.consentedAt).toEqual(createdAt);
      expect(record.locale).toBe('fr-FR');

      expectEmailCount(1);
      expectEmailWith({ to: 'import@example.com' });
    });

    it('should take the earliest registration for a shared address', async () => {
      const { accessToken, newsletter, event } = await setup();
      const earlier = new Date('2026-01-01T10:00:00Z');
      await RegistrationFactory.create({
        event: { connect: { id: event.id } },
        newsletterConsent: true,
        emails: ['shared@example.com'],
        createdAt: new Date('2026-04-01T10:00:00Z'),
      });
      await RegistrationFactory.create({
        event: { connect: { id: event.id } },
        newsletterConsent: true,
        emails: ['shared@example.com'],
        createdAt: earlier,
      });

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ eventId: event.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const record = await prisma.newsletterSubscriber.findFirstOrThrow({
        where: { newsletterId: newsletter.id },
      });
      expect(record.consentedAt).toEqual(earlier);
    });

    it('should only email addresses that are new to the newsletter', async () => {
      const { accessToken, newsletter, event } = await setup();
      await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
        email: 'existing@example.com',
      });
      await RegistrationFactory.create({
        event: { connect: { id: event.id } },
        newsletterConsent: true,
        emails: ['existing@example.com', 'fresh@example.com'],
      });

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ eventId: event.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toEqual({ added: 1, skipped: 1 });
      expectEmailCount(1);
      expectEmailWith({ to: 'fresh@example.com' });
    });

    it('should respond with `403` when the organization is not verified', async () => {
      const { accessToken, newsletter, event } = await setup('PENDING');

      await request()
        .post(`${BASE}/${newsletter.id}/subscribers/import`)
        .send({ eventId: event.id })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });
  });

  describe(`POST ${BASE}/:newsletterId/subscribers/:id/resend-confirmation`, () => {
    const url = (newsletterId: string, id: string) =>
      `${BASE}/${newsletterId}/subscribers/${id}/resend-confirmation`;

    it('should issue a new link and send it', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      const subscriber = await NewsletterSubscriberFactory.pending({
        newsletter: { connect: { id: newsletter.id } },
        subscribedAt: new Date(Date.now() - 2 * DAY),
      });

      await request()
        .post(url(newsletter.id, subscriber.id))
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const record = await prisma.newsletterSubscriber.findUniqueOrThrow({
        where: { id: subscriber.id },
      });
      expect(record.confirmationToken).not.toBe(subscriber.confirmationToken);
      expect(record.confirmationSentAt!.getTime()).toBeGreaterThan(
        subscriber.confirmationSentAt!.getTime(),
      );
      expectEmailCount(1);
      expectEmailWith({
        to: { name: subscriber.name!, address: subscriber.email },
      });
    });

    it('should respond with `429` right after a confirmation was sent', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      const subscriber = await NewsletterSubscriberFactory.pending({
        newsletter: { connect: { id: newsletter.id } },
      });

      await request()
        .post(url(newsletter.id, subscriber.id))
        .auth(accessToken, { type: 'bearer' })
        .expect(429);

      expect(mailer.sendMail).not.toHaveBeenCalled();
    });

    it('should respond with `409` when the subscriber already confirmed', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      const subscriber = await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
      });

      await request()
        .post(url(newsletter.id, subscriber.id))
        .auth(accessToken, { type: 'bearer' })
        .expect(409);
    });
  });

  describe(`${BASE}/confirm/:token`, () => {
    it('should describe the newsletter without confirming', async () => {
      const { newsletter } = await createNewsletterWithManager();
      const subscriber = await NewsletterSubscriberFactory.pending({
        newsletter: { connect: { id: newsletter.id } },
      });

      const { body } = await request()
        .get(`${BASE}/confirm/${subscriber.confirmationToken}`)
        .expect(200);

      expect(body.data).toEqual({
        newsletterName: 'Summer News',
        organizationName: expect.any(String),
        confirmed: false,
      });
      const record = await prisma.newsletterSubscriber.findUniqueOrThrow({
        where: { id: subscriber.id },
      });
      expect(record.confirmedAt).toBeNull();
    });

    it('should confirm the subscriber, and accept a second click', async () => {
      const { newsletter } = await createNewsletterWithManager();
      const subscriber = await NewsletterSubscriberFactory.pending({
        newsletter: { connect: { id: newsletter.id } },
      });
      const path = `${BASE}/confirm/${subscriber.confirmationToken}`;

      await request().post(path).expect(204);
      const confirmed = await prisma.newsletterSubscriber.findUniqueOrThrow({
        where: { id: subscriber.id },
      });
      expect(confirmed.confirmedAt).not.toBeNull();

      await request().post(path).expect(204);
      const { body } = await request().get(path).expect(200);
      expect(body.data.confirmed).toBe(true);

      const again = await prisma.newsletterSubscriber.findUniqueOrThrow({
        where: { id: subscriber.id },
      });
      expect(again.confirmedAt).toEqual(confirmed.confirmedAt);
    });

    it('should respond with `404` for an expired link', async () => {
      const { newsletter } = await createNewsletterWithManager();
      const subscriber = await NewsletterSubscriberFactory.pending({
        newsletter: { connect: { id: newsletter.id } },
        subscribedAt: new Date(Date.now() - 31 * DAY),
      });

      await request()
        .post(`${BASE}/confirm/${subscriber.confirmationToken}`)
        .expect(404);
    });

    it('should respond with `404` for an unknown token', async () => {
      await request()
        .post(`${BASE}/confirm/${'c'.repeat(64)}`)
        .expect(404);
    });
  });

  describe('sending messages', () => {
    it('should skip subscribers who have not confirmed', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
        email: 'confirmed@example.com',
      });
      await NewsletterSubscriberFactory.pending({
        newsletter: { connect: { id: newsletter.id } },
        email: 'pending@example.com',
      });

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/messages`)
        .send({ subject: 'Hello', body: '<p>World</p>' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data.recipientCount).toBe(1);
      expectEmailCount(1);
      expectEmailWith({
        to: expect.objectContaining({ address: 'confirmed@example.com' }),
      });
    });
  });

  describe('pending subscriber cleanup', () => {
    it('should delete only expired, unconfirmed subscribers', async () => {
      const newsletter = await NewsletterFactory.create();
      const old = new Date(Date.now() - 31 * DAY);
      const expired = await NewsletterSubscriberFactory.pending({
        newsletter: { connect: { id: newsletter.id } },
        subscribedAt: old,
      });
      const recent = await NewsletterSubscriberFactory.pending({
        newsletter: { connect: { id: newsletter.id } },
      });
      const confirmed = await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
        subscribedAt: old,
      });

      const count = await resolve(
        NewsletterSubscriberService,
      ).deleteExpiredPendingSubscribers();

      expect(count).toBe(1);
      const remaining = await prisma.newsletterSubscriber.findMany({
        where: { newsletterId: newsletter.id },
        select: { id: true },
      });
      expect(remaining.map((r) => r.id).sort()).toEqual(
        [recent.id, confirmed.id].sort(),
      );
      expect(remaining.map((r) => r.id)).not.toContain(expired.id);
    });
  });
});
