import { fakerDE as faker } from '@faker-js/faker';
import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';

export const DutyFactory = {
  build: (
    data: Partial<Prisma.DutyCreateInput> = {},
  ): Prisma.DutyCreateInput => {
    return {
      name: faker.lorem.words(2),
      event: {},
      ...data,
    };
  },

  create: async (data: Partial<Prisma.DutyCreateInput> = {}) => {
    return prisma.duty.create({
      data: DutyFactory.build(data),
    });
  },
};
