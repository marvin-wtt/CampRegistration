import { Prisma } from '@prisma/client';
import prisma from './prisma';
import { faker } from '@faker-js/faker/locale/en';

const defaultEvents = [
  'registration_confirmed',
  'registration_waitlisted',
  'registration_waitlist_accepted',
  'registration_updated',
  'registration_canceled',
];

export const MessageTemplateFactory = {
  build: (
    data: Partial<Prisma.MessageTemplateCreateInput> = {},
  ): Prisma.MessageTemplateCreateInput => {
    return {
      camp: data.camp ?? undefined,
      subject: data.subject ?? {
        en: faker.lorem.sentence(),
        de: faker.lorem.sentence(),
        fr: faker.lorem.sentence(),
      },
      body: data.body ?? {
        en: faker.lorem.paragraphs(3),
        de: faker.lorem.paragraphs(3),
        fr: faker.lorem.paragraphs(3),
      },
      ...data,
    };
  },

  buildDefaults: (
    builder?: (
      event: string,
    ) => Omit<Partial<Prisma.MessageTemplateCreateInput>, 'event'>,
  ) => {
    return defaultEvents.map((event) =>
      MessageTemplateFactory.build({
        event,
        ...builder?.(event),
      }),
    );
  },

  create: async (data: Partial<Prisma.MessageTemplateCreateInput> = {}) => {
    return prisma.messageTemplate.create({
      data: MessageTemplateFactory.build(data),
    });
  },
};
