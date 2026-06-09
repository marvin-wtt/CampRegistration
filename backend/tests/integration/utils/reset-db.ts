import prisma from '../client.js';

let cachedTableNames: string[] | null = null;

async function getTableNames(): Promise<string[]> {
  if (cachedTableNames) {
    return cachedTableNames;
  }

  const db = process.env.DATABASE_URL?.split('/')[3];

  const rows = await prisma.$queryRaw<
    Array<{ TABLE_NAME: string }>
  >`SELECT TABLE_NAME from information_schema.TABLES WHERE TABLE_SCHEMA = ${db};`;

  cachedTableNames = rows
    .map((r) => r.TABLE_NAME)
    .filter((name) => name !== '_prisma_migrations');

  return cachedTableNames;
}

export default async () => {
  // https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries
  // Use DELETE (DML) instead of TRUNCATE (DDL) so all deletes run in a single
  // real transaction. TRUNCATE causes an implicit commit per statement in MySQL,
  // making the prisma.$transaction array a no-op and paying full DDL overhead
  // (~50–100 ms) per table, per test.
  const tableNames = await getTableNames();

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;
    for (const table of tableNames) {
      await tx.$executeRawUnsafe(`DELETE FROM \`${table}\``);
    }
    await tx.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;
  });
};
