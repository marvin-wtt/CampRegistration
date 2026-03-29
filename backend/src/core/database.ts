import { PrismaClient } from '#/generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { createSoftDeleteExtension } from 'prisma-extension-soft-delete';
import logger from '#core/logger';
import config from '#config/index';

function createClient(): PrismaClient {
  const adapter = new PrismaMariaDb({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
  });

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

export async function connectDatabase() {
  await prisma.$connect();

  logger.info('Connected to SQL Database');
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

export default prisma;
