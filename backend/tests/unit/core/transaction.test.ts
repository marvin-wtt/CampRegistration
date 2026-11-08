import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '#generated/prisma/client.js';
import {
  currentTransaction,
  transactional,
  type PrismaTransaction,
} from '#core/database/transaction';

function fakeClient() {
  const tx = {} as PrismaTransaction;
  const $transaction = vi.fn(
    (fn: (tx: PrismaTransaction) => Promise<unknown>) => fn(tx),
  );
  return {
    client: { $transaction } as unknown as PrismaClient,
    tx,
    $transaction,
  };
}

describe('transactional', () => {
  it('exposes the transaction to everything the callback calls', async () => {
    const { client, tx } = fakeClient();

    const seen = await transactional(client, async () => {
      await Promise.resolve();
      return currentTransaction();
    });

    expect(seen).toBe(tx);
    expect(currentTransaction()).toBeUndefined();
  });

  it('joins an open transaction instead of starting another', async () => {
    const { client, tx, $transaction } = fakeClient();

    const inner = await transactional(client, () =>
      transactional(client, (joined) => Promise.resolve(joined)),
    );

    expect(inner).toBe(tx);
    expect($transaction).toHaveBeenCalledOnce();
  });

  it('runs the callback again after a write conflict when asked to', async () => {
    const { client, $transaction } = fakeClient();
    const conflict = Object.assign(new Error('deadlock'), { code: 'P2034' });
    let calls = 0;

    const result = await transactional(
      client,
      () => (++calls === 1 ? Promise.reject(conflict) : Promise.resolve(calls)),
      { retries: 2 },
    );

    expect(result).toBe(2);
    expect($transaction).toHaveBeenCalledTimes(2);
  });

  it('does not retry other errors, or without retries', async () => {
    const { client } = fakeClient();
    const conflict = Object.assign(new Error('deadlock'), { code: 'P2034' });

    await expect(
      transactional(client, () => Promise.reject(new Error('boom')), {
        retries: 2,
      }),
    ).rejects.toThrow('boom');
    await expect(
      transactional(client, () => Promise.reject(conflict)),
    ).rejects.toBe(conflict);
  });
});
