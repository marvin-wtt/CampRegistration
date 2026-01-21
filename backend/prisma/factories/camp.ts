import { faker } from '@faker-js/faker/locale/en';
import { Prisma } from '@prisma/client';
import prisma from './prisma.js';
import { MessageTemplateFactory } from './message-template.js';

export const CampFactory = {
  build: (
    data: Partial<Prisma.CampCreateInput> = {},
  ): Prisma.CampCreateInput => {
    const minAge = faker.number.int({ min: 1, max: 20 });
    const maxAge = faker.number.int({ min: minAge, max: 21 });

    const startAt = faker.date.future();
    const endAt = faker.date.future({
      refDate: startAt,
    });

    const createdAt = faker.date.past();
    const updatedAt = faker.date.between({
      from: createdAt,
      to: new Date(),
    });

    const maxParticipants = faker.number.int({ min: 1, max: 100 });

    const countries = data.countries ?? ['de'];
    return {
      public: faker.datatype.boolean(),
      active: faker.datatype.boolean(),
      countries,
      name: faker.lorem.word(),
      organizer: faker.company.name(),
      contactEmail: faker.internet.email(),
      maxParticipants,
      minAge,
      maxAge,
      startAt,
      endAt,
      price: faker.number.int({ min: 0, max: 1000 }),
      location: faker.location.city(),
      form: {},
      themes: {},
      createdAt,
      updatedAt,
      messageTemplates: data.messageTemplates ?? {
        createMany: {
          data: MessageTemplateFactory.buildDefaults(countries),
        },
      },
      ...data,
    };
  },

  create: async (data: Partial<Prisma.CampCreateInput> = {}) => {
    return prisma.camp.create({
      data: CampFactory.build(data),
    });
  },
};
