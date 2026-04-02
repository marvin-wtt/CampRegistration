import { describe, expect, it } from 'vitest';
import {
  NewsletterFactory,
  NewsletterMessageFactory,
  NewsletterSubscriberFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { ulid } from 'ulidx';
import { NoOpMailer } from '../../../src/app/mail/noop.mailer.js';

const mailer = NoOpMailer.prototype;

const BASE = '/api/v1/newsletters';

const createNewsletterWithManager = async () => {
  const user = await UserFactory.create();
  const accessToken = generateAccessToken(user);

  const newsletter = await NewsletterFactory.create({
    managers: { create: { userId: user.id } },
  });

  return { user, accessToken, newsletter };
};

describe(`${BASE}/:newsletterId/messages`, () => {
  describe(`GET ${BASE}/:newsletterId/messages`, () => {
    it('should respond with `200` and an empty array when there are no messages', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const { body } = await request()
        .get(`${BASE}/${newsletter.id}/messages`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toEqual([]);
    });

    it('should respond with `200` and the list of messages', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const message = await NewsletterMessageFactory.create({
        newsletter: { connect: { id: newsletter.id } },
        subject: 'Test Subject',
        body: '<p>Hello</p>',
        recipientCount: 5,
      });

      const { body } = await request()
        .get(`${BASE}/${newsletter.id}/messages`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toEqual({
        id: message.id,
        subject: 'Test Subject',
        body: '<p>Hello</p>',
        recipientCount: 5,
        sentAt: message.sentAt.toISOString(),
        sentBy: null,
      });
    });

    it('should return messages ordered by sentAt descending', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const first = await NewsletterMessageFactory.create({
        newsletter: { connect: { id: newsletter.id } },
        sentAt: new Date('2024-01-01T10:00:00Z'),
      });
      const second = await NewsletterMessageFactory.create({
        newsletter: { connect: { id: newsletter.id } },
        sentAt: new Date('2024-06-01T10:00:00Z'),
      });

      const { body } = await request()
        .get(`${BASE}/${newsletter.id}/messages`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data[0].id).toBe(second.id);
      expect(body.data[1].id).toBe(first.id);
    });

    it('should only return messages belonging to the requested newsletter', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const otherNewsletter = await NewsletterFactory.create();
      await NewsletterMessageFactory.create({
        newsletter: { connect: { id: otherNewsletter.id } },
      });
      const ownMessage = await NewsletterMessageFactory.create({
        newsletter: { connect: { id: newsletter.id } },
      });

      const { body } = await request()
        .get(`${BASE}/${newsletter.id}/messages`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe(ownMessage.id);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const newsletter = await NewsletterFactory.create();

      await request().get(`${BASE}/${newsletter.id}/messages`).expect(401);
    });

    it('should respond with `403` when user is not a manager of the newsletter', async () => {
      const newsletter = await NewsletterFactory.create();
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .get(`${BASE}/${newsletter.id}/messages`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `404` when newsletter does not exist', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .get(`${BASE}/${ulid()}/messages`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe(`POST ${BASE}/:newsletterId/messages`, () => {
    it('should respond with `200` and the queued recipient count', async () => {
      const { user, accessToken, newsletter } =
        await createNewsletterWithManager();
      await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
      });
      await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
      });

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/messages`)
        .send({ subject: 'Hello', body: '<p>World</p>' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data).toEqual({
        id: expect.any(String),
        subject: 'Hello',
        body: '<p>World</p>',
        recipientCount: 2,
        sentAt: expect.any(String),
        sentBy: { id: user.id, name: user.name },
      });
    });

    it('should record a message in the newsletter history', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
      });

      await request()
        .post(`${BASE}/${newsletter.id}/messages`)
        .send({ subject: 'Test Subject', body: '<p>Test Body</p>' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

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
        .post(`${BASE}/${newsletter.id}/messages`)
        .send({ subject: 'Hello', body: '<p>World</p>' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data).toHaveProperty('recipientCount', 0);
    });

    it('should send to subscribers with null name without error', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
        name: null,
      });

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/messages`)
        .send({ subject: 'Hello', body: '<p>World</p>' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data.recipientCount).toBe(1);
    });

    it('should send newsletter message when newsletter has no replyTo', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);
      const newsletter = await NewsletterFactory.create({
        replyTo: null,
        managers: { create: { userId: user.id } },
      });
      await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
      });

      const { body } = await request()
        .post(`${BASE}/${newsletter.id}/messages`)
        .send({ subject: 'No Reply', body: '<p>Content</p>' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body.data.recipientCount).toBe(1);
    });

    it('should send a mail to each subscriber', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      const sub1 = await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
        email: 'alice@example.com',
        name: 'Alice',
      });
      const sub2 = await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
        email: 'bob@example.com',
        name: 'Bob',
      });

      await request()
        .post(`${BASE}/${newsletter.id}/messages`)
        .send({ subject: 'Hello', body: '<p>World</p>' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(mailer.sendMail).toBeCalledTimes(2);
      expect(mailer.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: { name: sub1.name, address: sub1.email },
        }),
      );
      expect(mailer.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: { name: sub2.name, address: sub2.email },
        }),
      );
    });

    it('should not send any mails when there are no subscribers', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await request()
        .post(`${BASE}/${newsletter.id}/messages`)
        .send({ subject: 'Hello', body: '<p>World</p>' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(mailer.sendMail).not.toHaveBeenCalled();
    });

    it('should send mails with the correct subject', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();
      await NewsletterSubscriberFactory.create({
        newsletter: { connect: { id: newsletter.id } },
      });

      await request()
        .post(`${BASE}/${newsletter.id}/messages`)
        .send({ subject: 'My Subject', body: '<p>Content</p>' })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(mailer.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'My Subject' }),
      );
    });

    it('should respond with `400` when subject is missing', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await request()
        .post(`${BASE}/${newsletter.id}/messages`)
        .send({ body: '<p>No subject</p>' })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `400` when body is missing', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await request()
        .post(`${BASE}/${newsletter.id}/messages`)
        .send({ subject: 'No body' })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `401` when unauthenticated', async () => {
      const newsletter = await NewsletterFactory.create();

      await request()
        .post(`${BASE}/${newsletter.id}/messages`)
        .send({ subject: 'Hello', body: '<p>World</p>' })
        .expect(401);
    });

    it('should respond with `403` when user is not a manager', async () => {
      const newsletter = await NewsletterFactory.create();
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .post(`${BASE}/${newsletter.id}/messages`)
        .send({ subject: 'Hello', body: '<p>World</p>' })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `404` when newsletter does not exist', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .post(`${BASE}/${ulid()}/messages`)
        .send({ subject: 'Hello', body: '<p>World</p>' })
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe(`DELETE ${BASE}/:newsletterId/messages/:newsletterMessageId`, () => {
    it('should respond with `204` and delete the message', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const message = await NewsletterMessageFactory.create({
        newsletter: { connect: { id: newsletter.id } },
      });

      await request()
        .delete(`${BASE}/${newsletter.id}/messages/${message.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      const deleted = await prisma.newsletterMessage.findUnique({
        where: { id: message.id },
      });
      expect(deleted).toBeNull();
    });

    it('should not delete messages belonging to other newsletters', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      const otherNewsletter = await NewsletterFactory.create({
        managers: {
          create: { userId: (await UserFactory.create()).id },
        },
      });
      const otherMessage = await NewsletterMessageFactory.create({
        newsletter: { connect: { id: otherNewsletter.id } },
      });

      await request()
        .delete(`${BASE}/${newsletter.id}/messages/${otherMessage.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);

      const still = await prisma.newsletterMessage.findUnique({
        where: { id: otherMessage.id },
      });
      expect(still).not.toBeNull();
    });

    it('should respond with `401` when unauthenticated', async () => {
      const newsletter = await NewsletterFactory.create();
      const message = await NewsletterMessageFactory.create({
        newsletter: { connect: { id: newsletter.id } },
      });

      await request()
        .delete(`${BASE}/${newsletter.id}/messages/${message.id}`)
        .expect(401);
    });

    it('should respond with `403` when user is not a manager of the newsletter', async () => {
      const newsletter = await NewsletterFactory.create();
      const message = await NewsletterMessageFactory.create({
        newsletter: { connect: { id: newsletter.id } },
      });
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .delete(`${BASE}/${newsletter.id}/messages/${message.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `404` when newsletter does not exist', async () => {
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      await request()
        .delete(`${BASE}/${ulid()}/messages/${ulid()}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `404` when message does not exist', async () => {
      const { accessToken, newsletter } = await createNewsletterWithManager();

      await request()
        .delete(`${BASE}/${newsletter.id}/messages/${ulid()}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });
});
