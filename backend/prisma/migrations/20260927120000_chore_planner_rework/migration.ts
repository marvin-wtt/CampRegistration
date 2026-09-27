import type { Prisma } from '#generated/prisma/client.js';

/**
 * Chore slots used to be free text on each assignment. Turn every distinct
 * `(chore, slot)` label into a `ChoreSlot` — ordered by first use — and link
 * the assignments to it. The text column stays until the next release.
 */
export async function up(tx: Prisma.TransactionClient): Promise<void> {
  const assignments = await tx.choreAssignment.findMany({
    where: { slot: { not: null }, slotId: null },
    select: { id: true, choreId: true, slot: true },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  });

  const slotIds = new Map<string, string>();
  const sortOrders = new Map<string, number>();

  for (const assignment of assignments) {
    const label = assignment.slot?.trim();
    if (!label) {
      continue;
    }

    const key = `${assignment.choreId}\u0000${label}`;
    let slotId = slotIds.get(key);
    if (!slotId) {
      const sortOrder = sortOrders.get(assignment.choreId) ?? 0;
      sortOrders.set(assignment.choreId, sortOrder + 1);

      const slot = await tx.choreSlot.create({
        data: { choreId: assignment.choreId, name: label, sortOrder },
      });
      slotId = slot.id;
      slotIds.set(key, slotId);
    }

    await tx.choreAssignment.update({
      where: { id: assignment.id },
      data: { slotId },
    });
  }
}
