import { fakerEN as faker } from '@faker-js/faker';
import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';
import crypto from 'crypto';

const token = () => crypto.randomBytes(32).toString('hex');

/** Confirmed by default; `pending` builds one still awaiting the opt-in. */
export const NewsletterSubscriberFactory = {
  build: (
    data: Partial<Prisma.NewsletterSubscriberCreateInput> = {},
  ): Prisma.NewsletterSubscriberCreateInput => {
    const subscribedAt = data.subscribedAt ?? new Date();

    return {
      newsletter: {},
      email: faker.internet.exampleEmail().toLowerCase(),
      name: faker.person.fullName(),
      unsubscribeToken: token(),
      subscribedAt,
      consentedAt: subscribedAt,
      confirmedAt: subscribedAt,
      ...data,
    };
  },

  create: async (
    data: Partial<Prisma.NewsletterSubscriberCreateInput> = {},
  ) => {
    return prisma.newsletterSubscriber.create({
      data: NewsletterSubscriberFactory.build(data),
    });
  },

  pending: async (
    data: Partial<Prisma.NewsletterSubscriberCreateInput> = {},
  ) => {
    const subscribedAt = data.subscribedAt ?? new Date();

    return NewsletterSubscriberFactory.create({
      confirmedAt: null,
      confirmationToken: token(),
      confirmationSentAt: subscribedAt,
      ...data,
    });
  },
};
