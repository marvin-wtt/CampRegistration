import { Prisma } from '@prisma/client';
import prisma from './prisma';

export const RegistrationFactory = {
  build: (
    data: Partial<Prisma.RegistrationCreateInput> = {},
  ): Prisma.RegistrationCreateInput => {
    return {
      data: {},
      camp: {},
      ...data,
    };
  },

  create: async (data: Partial<Prisma.RegistrationCreateInput> = {}) => {
    return prisma.registration.create({
      data: RegistrationFactory.build(data),
    });
  },
};
