import { fakerDE as faker } from '@faker-js/faker';
import { Prisma } from '#/generated/prisma/client.js';
import prisma from './prisma';

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
