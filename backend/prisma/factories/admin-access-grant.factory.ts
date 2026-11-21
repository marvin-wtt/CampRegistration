import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';

type AdminAccessGrantFactoryInput =
  Partial<Prisma.AdminAccessGrantUncheckedCreateInput> &
    Pick<
      Prisma.AdminAccessGrantUncheckedCreateInput,
      'userId' | 'scope' | 'scopeId'
    >;

export const AdminAccessGrantFactory = {
  build: (
    data: AdminAccessGrantFactoryInput,
  ): Prisma.AdminAccessGrantUncheckedCreateInput => {
    return {
      reason: 'Support request',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      ...data,
    };
  },

  create: async (data: AdminAccessGrantFactoryInput) => {
    return prisma.adminAccessGrant.create({
      data: AdminAccessGrantFactory.build(data),
    });
  },
};
