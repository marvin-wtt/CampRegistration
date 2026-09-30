import { fakerEN as faker } from '@faker-js/faker';
import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';

export const PriceModelFactory = {
  build: (
    data: Partial<Prisma.PriceModelCreateInput> = {},
  ): Prisma.PriceModelCreateInput => {
    return {
      name: faker.commerce.productName(),
      currency: 'EUR',
      pricePerRegistration: 2,
      baseFee: 0,
      taxRate: 0,
      ...data,
    };
  },

  create: async (data: Partial<Prisma.PriceModelCreateInput> = {}) => {
    return prisma.priceModel.create({
      data: PriceModelFactory.build(data),
    });
  },
};
