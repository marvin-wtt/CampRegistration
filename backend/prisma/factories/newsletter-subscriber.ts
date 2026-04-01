import { fakerEN as faker } from '@faker-js/faker';
import { Prisma } from '#generated/prisma/client.js';
import prisma from './prisma.js';
import crypto from 'crypto';

export const NewsletterSubscriberFactory = {
  build: (
    data: Partial<Prisma.NewsletterSubscriberCreateInput> = {},
  ): Prisma.NewsletterSubscriberCreateInput => {
    return {
      newsletter: {},
      email: faker.internet.email(),
      name: faker.person.fullName(),
      country: faker.helpers.arrayElement(['de', 'fr', 'pl', 'cz']),
      unsubscribeToken: crypto.randomBytes(32).toString('hex'),
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
};
