import type { PrismaClient } from '#generated/prisma/client';

/** The client handed to an interactive `$transaction` callback. */
export type PrismaTransaction = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];
