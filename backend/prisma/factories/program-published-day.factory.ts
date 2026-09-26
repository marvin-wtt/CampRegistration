import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';

export const ProgramPublishedDayFactory = {
  build: (
    data: Partial<Prisma.ProgramPublishedDayCreateInput> = {},
  ): Prisma.ProgramPublishedDayCreateInput => {
    return {
      date: new Date().toISOString().split('T')[0],
      plan: 'both',
      event: {},
      ...data,
    };
  },

  create: async (data: Partial<Prisma.ProgramPublishedDayCreateInput> = {}) => {
    return prisma.programPublishedDay.create({
      data: ProgramPublishedDayFactory.build(data),
    });
  },
};
