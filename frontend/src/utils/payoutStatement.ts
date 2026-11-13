import type { Expense, Payout } from '@camp-registration/common/entities';

/** What a person confirms with a payout, in minor units. */
export interface PayoutStatement {
  /** The person's own expenses and refunds, by receipt number. */
  expenses: Expense[];
  paid: number;
  refunds: number;
  /** Payouts to and from the person before this one, by number. */
  earlier: Payout[];
  /** Balance before this payout: paid − refunds − earlier out + earlier in. */
  before: number;
  /** Balance once this payout is counted. */
  after: number;
}

/** Whether a record names the payout's recipient: by account, else by name. */
function isRecipient(
  payout: Payout,
  userId: string | null,
  name: string | null,
): boolean {
  return payout.recipientUserId
    ? userId === payout.recipientUserId
    : !userId && name === payout.recipientName;
}

/**
 * Everything the recipient of `payout` paid and got paid, up to and including
 * it: the content of the slip they sign.
 */
export function buildPayoutStatement(
  payout: Payout,
  expenses: readonly Expense[],
  payouts: readonly Payout[],
): PayoutStatement {
  const own = expenses
    .filter((e) => isRecipient(payout, e.paidByUserId, e.paidByName))
    .sort((a, b) => a.receiptNumber - b.receiptNumber);
  const earlier = payouts
    .filter(
      (p) =>
        p.number < payout.number &&
        isRecipient(payout, p.recipientUserId, p.recipientName),
    )
    .sort((a, b) => a.number - b.number);

  const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
  const paid = sum(
    own.filter((e) => e.type === 'EXPENSE').map((e) => e.amount),
  );
  const refunds = sum(
    own.filter((e) => e.type === 'REFUND').map((e) => e.amount),
  );
  const moved = (list: Payout[]) =>
    sum(list.map((p) => (p.direction === 'OUT' ? -p.amount : p.amount)));

  const before = paid - refunds + moved(earlier);

  return {
    expenses: own,
    paid,
    refunds,
    earlier,
    before,
    after: before + moved([payout]),
  };
}
