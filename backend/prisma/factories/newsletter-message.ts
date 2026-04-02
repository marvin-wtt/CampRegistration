import { Prisma } from '#generated/prisma/client';
import { fakerEN as faker } from '@faker-js/faker';
import prisma from './prisma.js';

export const NewsletterMessageFactory = {
  build: (
    data: Partial<Prisma.NewsletterMessageCreateInput> = {},
  ): Prisma.NewsletterMessageCreateInput => {
    return {
      newsletter: {},
      subject: faker.lorem.sentence({ min: 4, max: 8 }),
      body: `<p>${faker.lorem.paragraph()}</p><p>${faker.lorem.paragraph()}</p>`,
      recipientCount: faker.number.int({ min: 5, max: 50 }),
      ...data,
    };
  },

  create: async (data: Partial<Prisma.NewsletterMessageCreateInput> = {}) => {
    return prisma.newsletterMessage.create({
      data: NewsletterMessageFactory.build(data),
    });
  },
};
