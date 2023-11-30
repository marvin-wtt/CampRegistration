import { fakerDE as faker } from "@faker-js/faker";
import { Prisma, TokenType } from "@prisma/client";
import prisma from "../../tests/utils/prisma";

export const TokenFactory = {
  build: (data: Partial<Prisma.TokenCreateInput>): Prisma.TokenCreateInput => {
    return {
      expiresAt: faker.date.future({
        years: 1,
      }),
      blacklisted: false,
      token: "",
      type: faker.helpers.enumValue(TokenType),
      user: {},
      ...data,
    };
  },

  create: async (data: Partial<Prisma.TokenCreateInput> = {}) => {
    return prisma.token.create({
      data: TokenFactory.build(data),
    });
  },
};
