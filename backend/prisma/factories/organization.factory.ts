import { fakerEN as faker } from '@faker-js/faker';
import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';

export const OrganizationFactory = {
  build: (
    data: Partial<Prisma.OrganizationCreateInput> = {},
  ): Prisma.OrganizationCreateInput => {
    return {
      name: faker.company.name(),
      verificationStatus: 'VERIFIED',
      contactEmail: faker.internet.email(),
      phone: faker.phone.number(),
      website: faker.internet.url(),
      country: 'de',
      addressStreet: faker.location.streetAddress(),
      addressZipCode: faker.location.zipCode(),
      addressCity: faker.location.city(),
      registrationNumber: faker.string.alphanumeric(10).toUpperCase(),
      ...data,
    };
  },

  create: async (data: Partial<Prisma.OrganizationCreateInput> = {}) => {
    return prisma.organization.create({
      data: OrganizationFactory.build(data),
    });
  },
};
