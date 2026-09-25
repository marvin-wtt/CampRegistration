import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';
import { faker } from '@faker-js/faker/locale/en';

export const InvitationFactory = {
  build: (
    data: Partial<Prisma.EventInvitationCreateInput> = {},
  ): Prisma.EventInvitationCreateInput => {
    return {
      email: faker.internet.email(),
      ...data,
    };
  },

  create: async (data: Partial<Prisma.EventInvitationCreateInput> = {}) => {
    return prisma.eventInvitation.create({
      data: InvitationFactory.build(data),
    });
  },
};
