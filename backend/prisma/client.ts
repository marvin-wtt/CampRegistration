import { PrismaClient } from '#generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

/**
 * Plain Prisma client shared by the prisma/ tooling (data-migrations,
 * factories/seeders and scripts). Unlike `#core/database`, it deliberately
 * omits the soft-delete extension so these tools operate on raw rows.
 */
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL ?? ''),
});

export default prisma;
