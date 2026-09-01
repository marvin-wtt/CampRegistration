import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';

export const EventManagerFactory = {
  build: (
    data: Partial<Prisma.EventManagerCreateInput> = {},
  ): Prisma.EventManagerCreateInput => {
    return {
      event: undefined as unknown as {}, // Must be overwritten
      role: 'DIRECTOR',
      ...data,
    };
  },

  create: async (data: Partial<Prisma.EventManagerCreateInput> = {}) => {
    return prisma.eventManager.create({
      data: EventManagerFactory.build(data),
    });
  },
};
