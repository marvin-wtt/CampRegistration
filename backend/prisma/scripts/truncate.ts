import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function main() {
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

  console.log(`Start truncating all tables...`);

  // 2. Truncate every table
  const tableNames = await prisma.$queryRaw<
    Array<{ TABLE_NAME: string }>
  >`SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = DATABASE();`;

  for (const { TABLE_NAME } of tableNames) {
    console.log(`Truncating table: ${TABLE_NAME}`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${TABLE_NAME}\`;`);
  }

  // 3. Re-enable FK checks
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

  console.log('All tables truncated.');
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
