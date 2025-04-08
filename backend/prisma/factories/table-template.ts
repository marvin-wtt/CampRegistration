import { Prisma } from '@prisma/client';
import prisma from './prisma';

export const TableTemplateFactory = {
  build: (
    data: Partial<Prisma.TableTemplateCreateInput> = {},
  ): Prisma.TableTemplateCreateInput => {
    return {
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
