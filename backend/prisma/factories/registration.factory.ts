import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';
import { faker } from '@faker-js/faker/locale/en';
import {
  nextPaymentReference,
  randomReferenceCode,
} from '#app/finance/finance.sequence';

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
      phoneNumbers: [faker.phone.number({ style: 'international' })],
      street: faker.location.street(),
      city: faker.location.city(),
      zipCode: faker.location.zipCode(),
      country: faker.helpers.arrayElement(['gb', 'fr']),
      status: 'ACCEPTED',
      // Unique for a new event; `create` takes the event's next reference.
      paymentReference: `${randomReferenceCode()}-0001`,
      data: {},
      event: {},
      ...data,
    };
  },

  create: async (data: Partial<Prisma.RegistrationCreateInput> = {}) => {
    const eventId = data.event?.connect?.id;
    if (data.paymentReference !== undefined || !eventId) {
      return prisma.registration.create({
        data: RegistrationFactory.build(data),
      });
    }

    return prisma.$transaction(async (tx) => {
      const paymentReference = await nextPaymentReference(tx, eventId);

      return tx.registration.create({
        data: RegistrationFactory.build({ ...data, paymentReference }),
      });
    });
  },
};
