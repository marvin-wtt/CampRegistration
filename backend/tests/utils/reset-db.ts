import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async () => {
  const modelNames = Object.keys(prisma).filter(
    (key) => !["_", "$"].includes(key[0]),
  );

  for (const name of modelNames) {
    try {
      // @ts-expect-error https://github.com/prisma/docs/issues/451
      await prisma[name].deleteMany();
    } catch (e) {
      console.error(`Error while deleting ${name}`);
      throw e;
    }
  }

  prisma.$disconnect();
};
