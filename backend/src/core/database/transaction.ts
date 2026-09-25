import { AsyncLocalStorage } from 'node:async_hooks';
import type { PrismaClient } from '#generated/prisma/client';

/** The client handed to an interactive `$transaction` callback. */
export type PrismaTransaction = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];

export type TransactionOptions = Parameters<PrismaClient['$transaction']>[1];

const storage = new AsyncLocalStorage<PrismaTransaction>();

/** The transaction the current call chain runs in, if any. */
export function currentTransaction(): PrismaTransaction | undefined {
  return storage.getStore();
}

/**
 * Runs `fn` in a transaction that everything it calls joins implicitly. Inside
 * an open transaction it joins that one, and `options` are ignored.
 */
export function transactional<T>(
  client: PrismaClient,
  fn: (tx: PrismaTransaction) => Promise<T>,
  options?: TransactionOptions,
): Promise<T> {
  const open = storage.getStore();
  if (open) {
    return fn(open);
  }

  return client.$transaction((tx) => storage.run(tx, () => fn(tx)), options);
}
