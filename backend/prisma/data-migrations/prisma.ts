import { PrismaClient } from '#generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL ?? ''),
});

export default prisma;
