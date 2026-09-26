import { fakerDE as faker } from '@faker-js/faker';
import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';

export const ProgramItemFactory = {
  build: (
    data: Partial<Prisma.ProgramItemCreateInput> = {},
  ): Prisma.ProgramItemCreateInput => {
    return {
      title: faker.lorem.words(3),
      date: faker.date.future().toISOString().split('T')[0],
      time: '10:00',
      duration: faker.number.int({ min: 30, max: 120 }),
      color: faker.color.human(),
      plan: 'both',
      event: {},
      ...data,
    };
  },

  create: async (data: Partial<Prisma.ProgramItemCreateInput> = {}) => {
    return prisma.programItem.create({
      data: ProgramItemFactory.build(data),
    });
  },
};
