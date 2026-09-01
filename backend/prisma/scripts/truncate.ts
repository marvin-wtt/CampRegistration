import { pathToFileURL } from 'node:url';
import prisma from '../client.js';

export async function main() {
  // https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries
  const tableNames = await prisma.$queryRaw<
    Array<{ TABLE_NAME: string }>
  >`SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = DATABASE();`;

  // An interactive transaction rather than a batch, because
  // `SET FOREIGN_KEY_CHECKS` is session-scoped and every statement therefore
  // has to run on one connection. It buys no atomicity: TRUNCATE is DDL and
  // implicitly commits in MariaDB. The batch form also takes no timeout, and
  // the 5s default is not enough for a full truncate on a loaded CI runner —
  // the seed then fails with P2028.
  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;

      for (const { TABLE_NAME } of tableNames) {
        if (TABLE_NAME === '_prisma_migrations') {
          continue;
        }

        await tx.$executeRawUnsafe(`TRUNCATE ${TABLE_NAME};`);
      }

      await tx.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;
    },
    // Sometimes CI fails due to timeout.
    // This is an attempt to fix it.
    // But I really don't understand why it should ever take that long.
    { maxWait: 10_000, timeout: 60_000 },
  );
}

const isMainModule =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  main()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
