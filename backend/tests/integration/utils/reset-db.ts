import prisma from './prisma.js';

let cachedTableNames: string[] | null = null;

async function getTableNames(): Promise<string[]> {
  if (cachedTableNames) {
    return cachedTableNames;
  }

  const rows = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name != '_prisma_migrations';
  `;

  cachedTableNames = rows.map((r) => r.table_name);

  return cachedTableNames;
}

export default async () => {
  const tableNames = await getTableNames();

  if (tableNames.length === 0) return;

  const tables = tableNames
    .map((table) => `public."${table.replace(/"/g, '""')}"`)
    .join(', ');

  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTRICT`);
};
