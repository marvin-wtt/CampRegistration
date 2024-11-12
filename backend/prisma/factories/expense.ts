import { fakerDE as faker } from '@faker-js/faker';
import { Prisma } from '@prisma/client';
import prisma from '../../tests/utils/prisma';
import { ulid } from 'ulidx';

export const ExpenseFactory = {
  build: (
    data: Partial<Prisma.ExpenseCreateInput> = {},
  ): Prisma.ExpenseCreateInput => {
    return {
      id: ulid(),
      name: faker.string.alpha(),
      amount: faker.number.float({
        max: 100000,
        min: -100000,
        fractionDigits: 2,
      }),
      date: faker.date.recent(),
      camp: {},
      ...data,
    };
  },

  create: async (data: Partial<Prisma.ExpenseCreateInput> = {}) => {
    return prisma.expense.create({
      data: ExpenseFactory.build(data),
    });
  },
};
