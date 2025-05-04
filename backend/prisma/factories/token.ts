import { fakerDE as faker } from '@faker-js/faker';
import { type Prisma, TokenType } from '../../src/generated/prisma';
import prisma from './prisma';

type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>;

export const TokenFactory = {
  build: (
    data: PartialExcept<Prisma.TokenCreateInput, 'user'>,
  ): Prisma.TokenCreateInput => {
    return {
      expiresAt: faker.date.future({
        years: 1,
      }),
      blacklisted: false,
      token: faker.string.alphanumeric({
        length: 24,
      }),
      type: faker.helpers.enumValue(TokenType),
      ...data,
    };
  },

  create: async (data: PartialExcept<Prisma.TokenCreateInput, 'user'>) => {
    return prisma.token.create({
      data: TokenFactory.build(data),
    });
  },
};
