import { PrismaClient } from '#generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { createSoftDeleteExtension } from '@candoimage/prisma-extension-soft-delete';
import logger from '#core/logger';
import config from '#config';

function createClient(): PrismaClient {
  const adapter = new PrismaMariaDb(config.database.url);

  return new PrismaClient({ adapter }).$extends(
    createSoftDeleteExtension({
      models: {
        Registration: true,
      },
      defaultConfig: {
        field: 'deletedAt',
        createValue: (deleted) => {
          return deleted ? new Date() : null;
        },
      },
    }),
  ) as PrismaClient;
}

export const prisma: PrismaClient = createClient();

export async function verifyDatabaseConnection() {
  // The mariadb driver adapter connects lazily, so `$connect()` resolves even
  // when the database is unreachable. Run a real query to fail fast at startup.
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw new Error(
      `Failed to connect to the SQL database. Verify that the database is ` +
        `running and that DATABASE_URL points to it. Underlying error: ${reason}`,
      { cause },
    );
  }

  logger.info('Connected to SQL Database');
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

export default prisma;
