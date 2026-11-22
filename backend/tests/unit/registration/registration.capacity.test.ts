import { describe, expect, it, vi } from 'vitest';
import type { Prisma } from '#generated/prisma/client.js';
import {
  isFull,
  participantsOnly,
} from '#app/registration/registration.capacity';

function transaction(taken: number) {
  const count = vi.fn().mockResolvedValue(taken);
  const tx = { registration: { count } } as unknown as Prisma.TransactionClient;

  return { tx, count };
}

describe('isFull', () => {
  it('compares a single limit with every place taken', async () => {
    const { tx, count } = transaction(10);

    await expect(
      isFull(tx, { id: 'event', maxParticipants: 10 }, null),
    ).resolves.toBe(true);
    expect(count).toHaveBeenCalledWith({
      where: { eventId: 'event', ...participantsOnly },
    });
  });

  it('leaves room below the limit', async () => {
    const { tx } = transaction(9);

    await expect(
      isFull(tx, { id: 'event', maxParticipants: 10 }, null),
    ).resolves.toBe(false);
  });

  it('counts the group against its own limit', async () => {
    const { tx, count } = transaction(5);

    await expect(
      isFull(tx, { id: 'event', maxParticipants: { de: 5, fr: 8 } }, 'fr'),
    ).resolves.toBe(false);
    expect(count).toHaveBeenCalledWith({
      where: { eventId: 'event', group: 'fr', ...participantsOnly },
    });
  });

  it('refuses a group without a limit of its own', async () => {
    const { tx } = transaction(0);

    await expect(
      isFull(tx, { id: 'event', maxParticipants: { de: 5 } }, 'fr'),
    ).rejects.toThrow('Invalid or missing group');
    await expect(
      isFull(tx, { id: 'event', maxParticipants: { de: 5 } }, null),
    ).rejects.toThrow('Invalid or missing group');
  });
});
