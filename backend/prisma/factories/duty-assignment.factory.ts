import { fakerDE as faker } from '@faker-js/faker';
import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';

export const DutyAssignmentFactory = {
  build: (
    data: Partial<Prisma.DutyAssignmentCreateInput> = {},
  ): Prisma.DutyAssignmentCreateInput => {
    return {
      rotationUnit: 'PARTICIPANT',
      date: faker.date.future().toISOString().split('T')[0]!,
      event: {},
      duty: {},
      ...data,
    };
  },

  create: async (data: Partial<Prisma.DutyAssignmentCreateInput> = {}) => {
    return prisma.dutyAssignment.create({
      data: DutyAssignmentFactory.build(data),
    });
  },
};
