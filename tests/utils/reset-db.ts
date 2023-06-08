import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async () => {
  const modelNames = Object.keys(prisma).filter(
    (key) => !["_", "$"].includes(key[0])
  );

  for (let i = 0; i < modelNames.length; i += 1) {
    const name = modelNames[i];
    try {
      // @ts-expect-error https://github.com/prisma/docs/issues/451
      await prisma[name].deleteMany();
    } catch (e) {
      console.error(`Error while deleting ${name}`);
      throw e;
    }
  }
};
