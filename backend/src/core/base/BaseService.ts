import defaultPrisma from '#core/database/database.client';
import { type PrismaClient } from '#generated/prisma/client.js';
import {
  currentTransaction,
  type PrismaTransaction,
  transactional,
  type TransactionOptions,
} from '#core/database/transaction';

export abstract class BaseService {
  protected prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma ?? defaultPrisma;
  }

  /** The caller's open transaction, or the plain client outside of one. */
  protected get db(): PrismaTransaction {
    return currentTransaction() ?? this.prisma;
  }

  protected transaction<T>(
    fn: (tx: PrismaTransaction) => Promise<T>,
    options?: TransactionOptions,
  ): Promise<T> {
    return transactional(this.prisma, fn, options);
  }
}
