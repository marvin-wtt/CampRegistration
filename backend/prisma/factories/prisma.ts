import { PrismaClient } from '#generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL!),
});
export default prisma;
