import { fakerDE as faker } from '@faker-js/faker';
import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';

export const ChoreAssignmentFactory = {
  build: (
    data: Partial<Prisma.ChoreAssignmentCreateInput> = {},
  ): Prisma.ChoreAssignmentCreateInput => {
    const built: Prisma.ChoreAssignmentCreateInput = {
      rotationUnit: 'PARTICIPANT',
      date: faker.date.future(),
      event: {},
      chore: {},
      ...data,
    };

    // A bare `YYYY-MM-DD` string is a valid `date` override for callers, but
    // Prisma's client-side validation only accepts a full ISO-8601 datetime
    // string (or a Date) — normalize so tests/seeders can pass either.
    return {
      ...built,
      date: typeof built.date === 'string' ? new Date(built.date) : built.date,
    };
  },

  create: async (data: Partial<Prisma.ChoreAssignmentCreateInput> = {}) => {
    return prisma.choreAssignment.create({
      data: ChoreAssignmentFactory.build(data),
    });
  },
};
