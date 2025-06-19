import { fakerDE as faker } from '@faker-js/faker';
import type { Prisma } from '@prisma/client';
import prisma from './prisma';
import bcrypt from 'bcryptjs';

export const UserFactory = {
  build: (
    data: Partial<Prisma.UserCreateInput> = {},
  ): Prisma.UserCreateInput => {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      emailVerified: true,
      ...data,
      password: bcrypt.hashSync(data.password ?? 'password', 8),
    };
  },

  create: async (data: Partial<Prisma.UserCreateInput> = {}) => {
    return prisma.user.create({
      data: UserFactory.build(data),
    });
  },
};
