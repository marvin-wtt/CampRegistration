import prisma from './prisma';
import type { PrismaPromise } from '../../src/generated/prisma/client';

export default async () => {
  // https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries
  const transactions: PrismaPromise<any>[] = [];
  transactions.push(prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`);

  const db = process.env.DATABASE_URL.split('/')[3];

  const tableNames = await prisma.$queryRaw<
    Array<{ TABLE_NAME: string }>
  >`SELECT TABLE_NAME from information_schema.TABLES WHERE TABLE_SCHEMA = ${db};`;

  for (const { TABLE_NAME } of tableNames) {
    if (TABLE_NAME === '_prisma_migrations') {
      continue;
    }

    try {
      transactions.push(prisma.$executeRawUnsafe(`TRUNCATE ${TABLE_NAME};`));
    } catch (error) {
      console.error(`Error while deleting ${TABLE_NAME}`);
      console.error({ error });
    }
  }

  transactions.push(prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`);

  try {
    await prisma.$transaction(transactions);
  } catch (error) {
    console.log({ error });
  }
};
