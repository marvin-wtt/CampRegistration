import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';
import { faker } from '@faker-js/faker/locale/en';

const defaultTriggers = [
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
      event: data.event! ?? undefined,
      trigger: data.trigger ?? faker.lorem.slug(2),
      subject: data.subject ?? faker.lorem.sentence(),
      body: data.body ?? faker.lorem.paragraphs(1),
      ...data,
    };
  },

  buildDefaults: (
    countries: string[],
    builder?: (
      trigger: string,
    ) => Omit<Partial<Prisma.MessageTemplateCreateInput>, 'trigger'>,
  ) => {
    return countries.flatMap((country) =>
      defaultTriggers.map((trigger) =>
        MessageTemplateFactory.build({
          country,
          trigger,
          ...builder?.(trigger),
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
