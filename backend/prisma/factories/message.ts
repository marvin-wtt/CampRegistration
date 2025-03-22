import { Prisma } from '@prisma/client';
import prisma from './prisma';
import { faker } from '@faker-js/faker/locale/en';

export const MessageFactory = {
  build: (
    data: Partial<Prisma.MessageCreateInput> = {},
  ): Prisma.MessageCreateInput => {
    return {
      registration: {},
      subject: faker.lorem.sentence(),
      body: faker.lorem.paragraphs(3),
      ...data,
    };
  },

  create: async (data: Partial<Prisma.MessageCreateInput> = {}) => {
    return prisma.message.create({
      data: MessageFactory.build(data),
    });
  },
};
