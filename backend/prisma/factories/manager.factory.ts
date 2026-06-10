import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';

export const CampManagerFactory = {
  build: (
    data: Partial<Prisma.CampManagerCreateInput> = {},
  ): Prisma.CampManagerCreateInput => {
    return {
      camp: {},
      role: 'DIRECTOR',
      ...data,
    };
  },

  create: async (data: Partial<Prisma.CampManagerCreateInput> = {}) => {
    return prisma.campManager.create({
      data: CampManagerFactory.build(data),
    });
  },
};
