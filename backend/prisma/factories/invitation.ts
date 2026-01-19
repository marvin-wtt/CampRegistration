import { Prisma } from '@prisma/client';
import prisma from './prisma.js';
import { faker } from '@faker-js/faker/locale/en';

export const InvitationFactory = {
  build: (
    data: Partial<Prisma.InvitationCreateInput> = {},
  ): Prisma.InvitationCreateInput => {
    return {
      email: faker.internet.email(),
      ...data,
    };
  },

  create: async (data: Partial<Prisma.InvitationCreateInput> = {}) => {
    return prisma.invitation.create({
      data: InvitationFactory.build(data),
    });
  },
};
