import { Prisma } from '@prisma/client';
import prisma from './prisma';
import { ulid } from 'ulidx';

export const RegistrationFactory = {
  build: (
    data: Partial<Prisma.RegistrationCreateInput> = {},
  ): Prisma.RegistrationCreateInput => {
    return {
      id: ulid(),
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
