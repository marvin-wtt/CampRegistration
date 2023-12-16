import { Prisma } from '@prisma/client';
import prisma from '../../tests/utils/prisma';
import { ulid } from 'ulidx';
import { faker } from '@faker-js/faker/locale/de';

export const InvitationFactory = {
  build: (
    data: Partial<Prisma.InvitationCreateInput> = {},
  ): Prisma.InvitationCreateInput => {
    return {
      id: ulid(),
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
