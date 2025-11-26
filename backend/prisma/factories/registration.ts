import { Prisma } from '#/generated/prisma/client.js';
import prisma from './prisma';
import { faker } from '@faker-js/faker/locale/en';

export const RegistrationFactory = {
  build: (
    data: Partial<Prisma.RegistrationCreateInput> = {},
  ): Prisma.RegistrationCreateInput => {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role: 'participant',
      gender: faker.helpers.arrayElement(['m', 'f']),
      dateOfBirth: faker.date.birthdate({
        mode: 'age',
        min: 6,
        max: 17,
      }),
      emails: [faker.internet.email()],
      street: faker.location.street(),
      city: faker.location.city(),
      zipCode: faker.location.zipCode(),
      country: faker.helpers.arrayElement(['de', 'fr']),
      waitingList: false,
      data: {},
      camp: {},
      ...data,
    };
  },

  create: async (data: Partial<Prisma.RegistrationCreateInput> = {}) => {
    return prisma.registration.create({
      data: RegistrationFactory.build(data),
    });
  },
};
