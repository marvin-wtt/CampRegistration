import { randomInt } from 'node:crypto';
import type { PrismaTransaction } from '#core/database/transaction';
import {
  formatPaymentReference,
  REFERENCE_ALPHABET,
  REFERENCE_CODE_LENGTH,
} from '@camp-registration/common/utils';

/**
 * The next receipt, payout or income number of an event, never reused. The row lock
 * serializes concurrent callers until the caller's transaction ends; so does
 * the one in `nextPaymentReference`.
 */
export async function nextFinanceNumber(
  tx: PrismaTransaction,
  eventId: string,
  sequence: 'receipt' | 'payout' | 'income',
): Promise<number> {
  const counter = COUNTERS[sequence];
  const finance = await tx.eventFinance.update({
    where: { eventId },
    data:
      counter === 'lastReceiptNumber'
        ? { lastReceiptNumber: { increment: 1 } }
        : counter === 'lastPayoutNumber'
          ? { lastPayoutNumber: { increment: 1 } }
          : { lastIncomeNumber: { increment: 1 } },
    select: {
      lastReceiptNumber: true,
      lastPayoutNumber: true,
      lastIncomeNumber: true,
    },
  });

  return finance[counter];
}

const COUNTERS = {
  receipt: 'lastReceiptNumber',
  payout: 'lastPayoutNumber',
  income: 'lastIncomeNumber',
} as const;

/** A new registration's transfer reference: `K7MX-0042`. */
export async function nextPaymentReference(
  tx: PrismaTransaction,
  eventId: string,
): Promise<string> {
  const finance = await tx.eventFinance.update({
    where: { eventId },
    data: { lastReferenceNumber: { increment: 1 } },
    select: { referenceCode: true, lastReferenceNumber: true },
  });

  return formatPaymentReference(
    finance.referenceCode,
    finance.lastReferenceNumber,
  );
}

export function randomReferenceCode(): string {
  return Array.from(
    { length: REFERENCE_CODE_LENGTH },
    () => REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)],
  ).join('');
}

/** A reference code no event has yet: a new event's. */
export async function freeReferenceCode(
  tx: PrismaTransaction,
): Promise<string> {
  // A million codes: a few tries only fail once nearly all are taken.
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomReferenceCode();
    const taken = await tx.eventFinance.count({
      where: { referenceCode: code },
    });
    if (taken === 0) {
      return code;
    }
  }

  throw new Error('No free transfer reference code found');
}
