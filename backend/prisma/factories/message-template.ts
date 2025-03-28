import { Prisma } from '@prisma/client';
import prisma from './prisma';
import { faker } from '@faker-js/faker/locale/en';

export const MessageTemplateFactory = {
  build: (
    data: Partial<Prisma.MessageTemplateCreateInput> = {},
  ): Prisma.MessageTemplateCreateInput => {
    return {
      camp: {},
      subject: {
        en: faker.lorem.sentence(),
        de: faker.lorem.sentence(),
        fr: faker.lorem.sentence(),
      },
      body: {
        en: faker.lorem.paragraphs(3),
        de: faker.lorem.paragraphs(3),
        fr: faker.lorem.paragraphs(3),
      },
      ...data,
    };
  },

  create: async (data: Partial<Prisma.MessageTemplateCreateInput> = {}) => {
    return prisma.messageTemplate.create({
      data: MessageTemplateFactory.build(data),
    });
  },
};
