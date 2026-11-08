import { AsyncLocalStorage } from 'node:async_hooks';
import type { PrismaClient } from '#generated/prisma/client';
import logger from '#core/logger';
import { describeError } from '#utils/errors';

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

interface TransactionScope {
  tx: PrismaTransaction;
  afterCommit: (() => Promise<void>)[];
}

// Prisma's code for "write conflict or deadlock, please retry".
const WRITE_CONFLICT = 'P2034';

const storage = new AsyncLocalStorage<TransactionScope>();

/** The transaction the current call chain runs in, if any. */
export function currentTransaction(): PrismaTransaction | undefined {
  return storage.getStore()?.tx;
}

/**
 * Runs `fn` once the current transaction committed, or right away outside of
 * one; never if it rolls back. For side effects outside the database, such as
 * provider calls. Best effort: a failure is logged, the commit stands.
 */
export async function afterCommit(fn: () => Promise<void>): Promise<void> {
  const scope = storage.getStore();
  if (scope) {
    scope.afterCommit.push(fn);
    return;
  }

  await runLogged(fn);
}

async function runLogged(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    logger.error(`After-commit task failed: ${describeError(error)}`);
  }
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
    return fn(open.tx);
  }

  const { retries = 0, ...transactionOptions } = options ?? {};
  for (let attempt = 0; ; attempt++) {
    // Fresh per attempt: a rolled-back attempt's tasks never run.
    const pending: (() => Promise<void>)[] = [];
    try {
      const result = await client.$transaction(
        (tx) => storage.run({ tx, afterCommit: pending }, () => fn(tx)),
        transactionOptions,
      );
      for (const task of pending) {
        await runLogged(task);
      }
      return result;
    } catch (error) {
      if (attempt >= retries || !isWriteConflict(error)) {
        throw error;
      }
    }
  }
}
