import type { PrismaTransaction } from '#core/database/transaction';

/**
 * The next receipt or payout number of an event, never reused. The row lock
 * serializes concurrent captures until the caller's transaction ends.
 */
export async function nextFinanceNumber(
  tx: PrismaTransaction,
  eventId: string,
  sequence: 'receipt' | 'payout',
): Promise<number> {
  const finance = await tx.eventFinance.update({
    where: { eventId },
    data:
      sequence === 'receipt'
        ? { lastReceiptNumber: { increment: 1 } }
        : { lastPayoutNumber: { increment: 1 } },
    select: { lastReceiptNumber: true, lastPayoutNumber: true },
  });

  return sequence === 'receipt'
    ? finance.lastReceiptNumber
    : finance.lastPayoutNumber;
}
