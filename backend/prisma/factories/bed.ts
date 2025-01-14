import { Prisma } from '@prisma/client';
import prisma from './prisma';
import { ulid } from 'ulidx';

export const BedFactory = {
  build: (data: Partial<Prisma.BedCreateInput> = {}): Prisma.BedCreateInput => {
    return {
      id: ulid(),
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
