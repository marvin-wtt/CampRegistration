import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';
import { faker } from '@faker-js/faker/locale/en';

export const MessageFactory = {
  build: (
    data: Partial<Prisma.MessageCreateInput> = {},
  ): Prisma.MessageCreateInput => {
    return {
      camp: data.camp! ?? undefined,
      subject: faker.lorem.sentence(),
      body: faker.lorem.paragraphs(1),
      ...data,
    };
  },

  create: async (data: Partial<Prisma.MessageCreateInput> = {}) => {
    return prisma.message.create({
      data: MessageFactory.build(data),
    });
  },
};
