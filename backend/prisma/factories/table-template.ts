import { Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/en';
import prisma from './prisma.js';

export const TableTemplateFactory = {
  build: (
    data: Partial<Prisma.TableTemplateCreateInput> = {},
  ): Prisma.TableTemplateCreateInput => {
    return {
      camp: {},
      data: {
        title: {
          en: faker.commerce.productName(),
          de: faker.commerce.productName(),
        },
        columns: Array.from({ length: 3 }).map(() => ({
          name: faker.lorem.word(),
          label: {
            en: faker.lorem.words(2),
            de: faker.lorem.words(2),
          },
          source: 'form',
          field: faker.database.column(),
          required: faker.datatype.boolean(),
          align: faker.helpers.arrayElement(['left', 'center', 'right']),
          sortable: faker.datatype.boolean(),
          sortOrder: faker.helpers.arrayElement(['ad', 'da']),
          renderAs: undefined,
          renderOptions: undefined,
          isArray: undefined,
          headerVertical: undefined,
          shrink: undefined,
          hideIf: undefined,
          showIf: undefined,
          style: undefined,
          classes: undefined,
          headerStyle: undefined,
          headerClasses: undefined,
        })),
        order: faker.number.int({ min: 1, max: 10 }),
        filter: undefined,
        filterStatus: undefined,
        filterRoles: undefined,
        printOptions: undefined,
        indexed: faker.datatype.boolean(),
        actions: faker.datatype.boolean(),
        sortBy: faker.database.column(),
        sortDirection: faker.helpers.arrayElement(['asc', 'desc']),
        generated: true,
      },
      ...data,
    };
  },

  create: async (data: Partial<Prisma.TableTemplateCreateInput> = {}) => {
    return prisma.tableTemplate.create({
      data: TableTemplateFactory.build(data),
    });
  },
};
