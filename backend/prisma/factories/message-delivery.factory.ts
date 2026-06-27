import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';
import { faker } from '@faker-js/faker/locale/en';

export const MessageDeliveryFactory = {
  build: (
    data: Partial<Prisma.MessageDeliveryCreateInput> = {},
  ): Prisma.MessageDeliveryCreateInput => {
    return {
      registration: {},
      subject: faker.lorem.sentence(),
      body: faker.lorem.paragraphs(3),
      ...data,
    };
  },

  create: async (data: Partial<Prisma.MessageDeliveryCreateInput> = {}) => {
    return prisma.messageDelivery.create({
      data: MessageDeliveryFactory.build(data),
    });
  },
};
