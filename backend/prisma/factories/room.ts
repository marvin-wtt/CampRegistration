import { fakerDE as faker } from '@faker-js/faker';
import { Prisma } from '@prisma/client';
import prisma from './prisma.js';

export const RoomFactory = {
  build: (
    data: Partial<Prisma.RoomCreateInput> = {},
  ): Prisma.RoomCreateInput => {
    return {
      name: faker.string.alpha(),
      camp: {},
      ...data,
    };
  },

  create: async (data: Partial<Prisma.RoomCreateInput> = {}) => {
    return prisma.room.create({
      data: RoomFactory.build(data),
    });
  },
};
