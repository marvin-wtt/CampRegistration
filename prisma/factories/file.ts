import { faker } from "@faker-js/faker/locale/de";
import { Prisma } from "@prisma/client";
import prisma from "../../tests/utils/prisma";
import { ulid } from "ulidx";

export const FileFactory = {
  build: (data: Partial<Prisma.FileCreateInput>): Prisma.FileCreateInput => {
    return {
      id: ulid(),
      name: faker.string.uuid() + "pdf",
      type: 'application/pdf',
      size: faker.number.int(),
      originalName: faker.system.fileName()
    };
  },

  create: async (data: Partial<Prisma.FileCreateInput> = {}) => {
    return prisma.file.create({
      data: FileFactory.build(data),
    });
  },
};
