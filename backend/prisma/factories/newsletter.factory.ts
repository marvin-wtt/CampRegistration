import { fakerEN as faker } from '@faker-js/faker';
import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';
import { OrganizationFactory } from './organization.factory';

export const NewsletterFactory = {
  build: (
    data: Partial<Prisma.NewsletterCreateInput> = {},
  ): Prisma.NewsletterCreateInput => {
    return {
      // See camp.factory: the relation and the scalar id are mutually exclusive.
      ...('organization' in data || 'organizationId' in data
        ? {}
        : { organization: { create: OrganizationFactory.build() } }),
      name: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      replyTo: faker.internet.email(),
      ...data,
    };
  },

  create: async (data: Partial<Prisma.NewsletterCreateInput> = {}) => {
    return prisma.newsletter.create({ data: NewsletterFactory.build(data) });
  },
};
