import { Prisma } from '@prisma/client';
import prisma from './prisma';
import { ulid } from 'ulidx';

export const TableTemplateFactory = {
  build: (
    data: Partial<Prisma.TableTemplateCreateInput> = {},
  ): Prisma.TableTemplateCreateInput => {
    return {
      id: ulid(),
      camp: {},
      data: {},
      ...data,
    };
  },

  create: async (data: Partial<Prisma.TableTemplateCreateInput> = {}) => {
    return prisma.tableTemplate.create({
      data: TableTemplateFactory.build(data),
    });
  },
};
