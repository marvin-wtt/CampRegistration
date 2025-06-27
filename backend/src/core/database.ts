import { PrismaClient } from '@prisma/client';
import { createSoftDeleteExtension } from 'prisma-extension-soft-delete';
import logger from '#core/logger';

function createClient(): PrismaClient {
  return new PrismaClient().$extends(
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
