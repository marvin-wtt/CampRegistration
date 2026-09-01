import { fakerDE as faker } from '@faker-js/faker';
import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';

export const ChoreAssignmentFactory = {
  build: (
    data: Partial<Prisma.ChoreAssignmentCreateInput> = {},
  ): Prisma.ChoreAssignmentCreateInput => {
    return {
      rotationUnit: 'PARTICIPANT',
      date: faker.date.future().toISOString().split('T')[0]!,
      event: {},
      chore: {},
      ...data,
    };
  },

  create: async (data: Partial<Prisma.ChoreAssignmentCreateInput> = {}) => {
    return prisma.choreAssignment.create({
      data: ChoreAssignmentFactory.build(data),
    });
  },
};
