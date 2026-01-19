import { faker } from '@faker-js/faker/locale/en';
import { Prisma } from '@prisma/client';
import prisma from './prisma.js';

export const FileFactory = {
  build: (
    data: Partial<Prisma.FileCreateInput> = {},
  ): Prisma.FileCreateInput => {
    return {
      accessLevel: 'public',
      storageLocation: 'local',
      name: faker.string.uuid() + 'pdf',
      type: 'application/pdf',
      size: faker.number.int({ min: 0, max: 1e6 }),
      originalName: faker.system.fileName(),
      ...data,
    };
  },

  create: async (data: Partial<Prisma.FileCreateInput> = {}) => {
    return prisma.file.create({
      data: FileFactory.build(data),
    });
  },
};
