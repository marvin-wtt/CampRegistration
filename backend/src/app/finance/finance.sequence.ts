import type { PrismaTransaction } from '#core/database/transaction';

/**
 * The next receipt or payout number of an event, never reused. Raw SQL, so
 * handing out a number doesn't touch the event's `updatedAt`; the row lock
 * serializes concurrent captures until the caller's transaction ends.
 */
export async function nextFinanceNumber(
  tx: PrismaTransaction,
  eventId: string,
  sequence: 'receipt' | 'payout',
): Promise<number> {
  if (sequence === 'receipt') {
    await tx.$executeRaw`UPDATE events SET last_receipt_number = last_receipt_number + 1 WHERE id = ${eventId}`;
  } else {
    await tx.$executeRaw`UPDATE events SET last_payout_number = last_payout_number + 1 WHERE id = ${eventId}`;
  }

  const event = await tx.event.findUniqueOrThrow({
    where: { id: eventId },
    select: { lastReceiptNumber: true, lastPayoutNumber: true },
  });

  return sequence === 'receipt'
    ? event.lastReceiptNumber
    : event.lastPayoutNumber;
}
