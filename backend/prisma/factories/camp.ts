import { faker } from '@faker-js/faker/locale/de';
import { Prisma } from '@prisma/client';
import prisma from './prisma';
import { ulid } from 'ulidx';

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

    return {
      id: ulid(),
      public: faker.datatype.boolean(),
      active: faker.datatype.boolean(),
      countries: ['de'],
      name: faker.lorem.word(),
      organizer: faker.company.name(),
      contactEmail: faker.internet.email(),
      maxParticipants,
      freePlaces: maxParticipants,
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
      ...data,
    };
  },

  create: async (data: Partial<Prisma.CampCreateInput> = {}) => {
    return prisma.camp.create({
      data: CampFactory.build(data),
    });
  },
};
