import { fakerDE as faker } from '@faker-js/faker';
import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';

export const TaskFactory = {
  build: (
    data: Partial<Prisma.TaskCreateInput> = {},
  ): Prisma.TaskCreateInput => {
    return {
      title: faker.lorem.words(3),
      notes: faker.lorem.sentence(),
      dueDate: faker.date.future().toISOString().split('T')[0],
      completed: false,
      camp: {},
      ...data,
    };
  },

  create: async (data: Partial<Prisma.TaskCreateInput> = {}) => {
    return prisma.task.create({
      data: TaskFactory.build(data),
    });
  },
};
