import { fakerDE as faker } from "@faker-js/faker";
import { Prisma } from "@prisma/client";
import prisma from "../../tests/utils/prisma";
import { ulid } from "ulidx";

export const UserFactory = {
  build: (
    data: Partial<Prisma.UserCreateInput> = {},
  ): Prisma.UserCreateInput => {
    return {
      id: ulid(),
      name: faker.person.fullName(),
      password: "password",
      email: faker.internet.email(),
      emailVerified: true,
      ...data,
    };
  },

  create: async (data: Partial<Prisma.UserCreateInput> = {}) => {
    return prisma.user.create({
      data: UserFactory.build(data),
    });
  },
};
