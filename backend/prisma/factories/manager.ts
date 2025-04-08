import { Prisma } from '@prisma/client';
import prisma from './prisma';

export const CampManagerFactory = {
  build: (
    data: Partial<Prisma.CampManagerCreateInput> = {},
  ): Prisma.CampManagerCreateInput => {
    return {
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
