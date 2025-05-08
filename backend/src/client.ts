import { PrismaClient } from '#generated/prisma/client';
import config from '#config/index';
import { createSoftDeleteExtension } from 'prisma-extension-soft-delete';

// add prisma to the NodeJS global type
interface CustomNodeJsGlobal extends Global {
  prisma: PrismaClient;
}

// Prevent multiple instances of Prisma Client in development
declare const global: CustomNodeJsGlobal;

function createClient() {
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
  );
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const prisma = global.prisma || createClient();

if (config.env === 'development') global.prisma = prisma;

export default prisma;
