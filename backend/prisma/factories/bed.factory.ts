import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';

export const BedFactory = {
  build: (data: Partial<Prisma.BedCreateInput> = {}): Prisma.BedCreateInput => {
    return {
      room: {},
      ...data,
    };
  },

  create: async (data: Partial<Prisma.BedCreateInput> = {}) => {
    return prisma.bed.create({
      data: BedFactory.build(data),
    });
  },
};
