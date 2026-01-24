import { Prisma } from '@prisma/client';
import prisma from './prisma.js';
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
      camp: data.camp! ?? undefined,
      subject: data.subject ?? faker.lorem.sentence(),
      body: data.body ?? faker.lorem.paragraphs(1),
      ...data,
    };
  },

  buildDefaults: (
    countries: string[],
    builder?: (
      event: string,
    ) => Omit<Partial<Prisma.MessageTemplateCreateInput>, 'event'>,
  ) => {
    return countries.flatMap((country) =>
      defaultEvents.map((event) =>
        MessageTemplateFactory.build({
          country,
          event,
          ...builder?.(event),
        }),
      ),
    );
  },

  create: async (data: Partial<Prisma.MessageTemplateCreateInput> = {}) => {
    return prisma.messageTemplate.create({
      data: MessageTemplateFactory.build(data),
    });
  },
};
