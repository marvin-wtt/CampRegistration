import { fakerDE as faker } from '@faker-js/faker';
import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';

export const ChoreFactory = {
  build: (
    data: Partial<Prisma.ChoreCreateInput> = {},
  ): Prisma.ChoreCreateInput => {
    return {
      name: faker.lorem.words(2),
      event: {},
      ...data,
    };
  },

  create: async (data: Partial<Prisma.ChoreCreateInput> = {}) => {
    return prisma.chore.create({
      data: ChoreFactory.build(data),
    });
  },
};
