import { faker } from "@faker-js/faker/locale/de";
import { Prisma } from "@prisma/client";
import prisma from "../../tests/utils/prisma";
import { ulid } from "ulidx";

export const RegistrationFactory = {
  build: (data: Partial<Prisma.RegistrationCreateInput>): Prisma.RegistrationCreateInput => {
    return {
      id: ulid(),
      data: {}
    };
  },

  create: async (data: Partial<Prisma.RegistrationCreateInput> = {}) => {
    return prisma.registration.create({
      data: RegistrationFactory.build(data),
    });
  },
};