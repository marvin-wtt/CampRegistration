import { fakerDE as faker } from '@faker-js/faker';
import { Prisma } from '@prisma/client';
import prisma from '../../tests/utils/prisma';
import { ulid } from 'ulidx';

export const RoomFactory = {
  build: (
    data: Partial<Prisma.RoomCreateInput> = {},
  ): Prisma.RoomCreateInput => {
    return {
      id: ulid(),
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
