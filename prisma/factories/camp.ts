import { faker } from "@faker-js/faker/locale/de";
import { Prisma } from "@prisma/client";
import prisma from "../../tests/utils/prisma";
import { ulid } from "ulidx";

export const CampFactory = {
  build: (data: Partial<Prisma.CampCreateInput>): Prisma.CampCreateInput => {
    const minAge = faker.number.int({ min: 1, max: 20 });
    const maxAge = faker.number.int({ min: minAge, max: 21 });

    const startAt = faker.date.future();
    const endAt = faker.date.between({
      from: startAt.getDate(),
      to: faker.date.future(),
    });

    const createdAt = faker.date.past();
    const updatedAt = faker.date.between({
      from: createdAt,
      to: new Date(),
    });

    return {
      id: ulid(),
      public: faker.datatype.boolean(),
      countries: ["de"],
      name: { de: faker.lorem.word() },
      maxParticipants: {
        de: faker.number.int({ min: 1, max: 100 }),
      },
      minAge,
      maxAge,
      startAt,
      endAt,
      price: faker.number.int({ min: 0, max: 1000 }),
      location: { de: faker.location.city() },
      form: {}, // TODO
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
