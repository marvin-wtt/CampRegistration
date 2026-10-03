import { faker } from '@faker-js/faker/locale/en';
import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';
import { MessageTemplateFactory } from './message-template.factory';
import { OrganizationFactory } from './organization.factory';
import {
  FREE_PRICE_MODEL_ID,
  FREE_PRICE_MODEL_NAME,
} from '#app/priceModel/price-model.utils';

export const EventFactory = {
  build: (
    data: Partial<Prisma.EventCreateInput> = {},
  ): Prisma.EventCreateInput => {
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
      // Give the event an owner unless the caller named one.
      organization: data.organization ?? {
        create: OrganizationFactory.build(),
      },
      // A new organization starts on the free model, so does its event.
      // `create()` pins an event of an existing organization to that
      // organization's model instead, as the API does.
      priceModel: {
        connectOrCreate: {
          where: { id: FREE_PRICE_MODEL_ID },
          create: { id: FREE_PRICE_MODEL_ID, name: FREE_PRICE_MODEL_NAME },
        },
      },
      listed: faker.datatype.boolean(),
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
      registrationOpensAt: faker.date.past(),
      ...data,
    };
  },

  create: async (data: Partial<Prisma.EventCreateInput> = {}) => {
    const organizationId = data.organization?.connect?.id;
    const pinned =
      data.priceModel === undefined && organizationId
        ? await prisma.organization.findUniqueOrThrow({
            where: { id: organizationId },
            select: { priceModelId: true },
          })
        : undefined;

    return prisma.event.create({
      data: EventFactory.build({
        ...data,
        ...(pinned
          ? { priceModel: { connect: { id: pinned.priceModelId } } }
          : {}),
      }),
    });
  },
};
