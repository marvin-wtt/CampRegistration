import prisma from './prisma';

export default async () => {
  const modelNames = Object.keys(prisma).filter(
    (key) => !['_', '$'].includes(key[0]),
  );

  for (const name of modelNames) {
    try {
      await prisma[name].deleteMany();
    } catch (e) {
      console.error(`Error while deleting ${name}`);
      throw e;
    }
  }
};
