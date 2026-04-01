import { fakerEN as faker } from '@faker-js/faker';
import { Prisma } from '#generated/prisma/client.js';
import prisma from './prisma.js';

export const NewsletterFactory = {
  build: (
    data: Partial<Prisma.NewsletterCreateInput> = {},
  ): Prisma.NewsletterCreateInput => {
    return {
      name: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      ...data,
    };
  },

  create: async (data: Partial<Prisma.NewsletterCreateInput> = {}) => {
    return prisma.newsletter.create({ data: NewsletterFactory.build(data) });
  },
};
