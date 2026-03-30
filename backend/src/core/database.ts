import { PrismaClient } from '#/generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { createSoftDeleteExtension } from 'prisma-extension-soft-delete';
import logger from '#core/logger';
import config from '#config';

export function createPrismaClient(): PrismaClient {
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

export const prisma: PrismaClient = createPrismaClient();

export async function connectDatabase() {
  await prisma.$connect();

  logger.info('Connected to SQL Database');
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

export default prisma;
