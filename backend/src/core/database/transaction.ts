import { AsyncLocalStorage } from 'node:async_hooks';
import type { PrismaClient } from '#generated/prisma/client';

/** The client handed to an interactive `$transaction` callback. */
export type PrismaTransaction = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];

export type TransactionOptions = Parameters<PrismaClient['$transaction']>[1] & {
  /**
   * How often to run `fn` again after a deadlock or serialization conflict.
   * Only for callbacks without side effects outside the database.
   */
  retries?: number;
};

// Prisma's code for "write conflict or deadlock, please retry".
const WRITE_CONFLICT = 'P2034';

const storage = new AsyncLocalStorage<PrismaTransaction>();

/** The transaction the current call chain runs in, if any. */
export function currentTransaction(): PrismaTransaction | undefined {
  return storage.getStore();
}

function isWriteConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === WRITE_CONFLICT
  );
}

/**
 * Runs `fn` in a transaction that everything it calls joins implicitly. Inside
 * an open transaction it joins that one, and `options` are ignored.
 */
export async function transactional<T>(
  client: PrismaClient,
  fn: (tx: PrismaTransaction) => Promise<T>,
  options?: TransactionOptions,
): Promise<T> {
  const open = storage.getStore();
  if (open) {
    return fn(open);
  }

  const { retries = 0, ...transactionOptions } = options ?? {};
  for (let attempt = 0; ; attempt++) {
    try {
      return await client.$transaction(
        (tx) => storage.run(tx, () => fn(tx)),
        transactionOptions,
      );
    } catch (error) {
      if (attempt >= retries || !isWriteConflict(error)) {
        throw error;
      }
    }
  }
}
