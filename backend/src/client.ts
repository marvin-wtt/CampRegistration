import { PrismaClient } from '@prisma/client';
import config from '#config/index';

// add prisma to the NodeJS global type
interface CustomNodeJsGlobal extends Global {
  prisma: PrismaClient;
}

// Prevent multiple instances of Prisma Client in development
declare const global: CustomNodeJsGlobal;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const prisma = global.prisma || new PrismaClient();

if (config.env === 'development') global.prisma = prisma;

export default prisma;
