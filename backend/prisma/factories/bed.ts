import type { Prisma } from '../../src/generated/prisma';
import prisma from './prisma';

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
