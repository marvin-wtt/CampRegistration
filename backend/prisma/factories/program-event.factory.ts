import { fakerDE as faker } from '@faker-js/faker';
import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';

export const ProgramEventFactory = {
  build: (
    data: Partial<Prisma.ProgramEventCreateInput> = {},
  ): Prisma.ProgramEventCreateInput => {
    return {
      title: faker.lorem.words(3),
      date: faker.date.future().toISOString().split('T')[0],
      time: '10:00',
      duration: faker.number.int({ min: 30, max: 120 }),
      color: faker.color.human(),
      plan: 'both',
      camp: {},
      ...data,
    };
  },

  create: async (data: Partial<Prisma.ProgramEventCreateInput> = {}) => {
    return prisma.programEvent.create({
      data: ProgramEventFactory.build(data),
    });
  },
};
