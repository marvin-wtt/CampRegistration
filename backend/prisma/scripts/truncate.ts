import { PrismaClient, PrismaPromise } from '../../src/generated/prisma/client';

const prisma = new PrismaClient();

export async function main() {
  // https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries
  const transactions: PrismaPromise<any>[] = [];
  transactions.push(prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`);

  const tableNames = await prisma.$queryRaw<
    Array<{ TABLE_NAME: string }>
  >`SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = DATABASE();`;

  for (const { TABLE_NAME } of tableNames) {
    if (TABLE_NAME === '_prisma_migrations') {
      continue;
    }

    transactions.push(prisma.$executeRawUnsafe(`TRUNCATE ${TABLE_NAME};`));
  }

  transactions.push(prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`);

  await prisma.$transaction(transactions);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
