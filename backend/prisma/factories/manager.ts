import { Prisma } from '@prisma/client';
import prisma from './prisma';
import { ulid } from 'ulidx';

export const CampManagerFactory = {
  build: (
    data: Partial<Prisma.CampManagerCreateInput> = {},
  ): Prisma.CampManagerCreateInput => {
    return {
      id: ulid(),
      camp: {},
      ...data,
    };
  },

  create: async (data: Partial<Prisma.CampManagerCreateInput> = {}) => {
    return prisma.campManager.create({
      data: CampManagerFactory.build(data),
    });
  },
};
