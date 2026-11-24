/** How an expense or income list can be sorted. */
export const LEDGER_SORTS = ['newest', 'oldest', 'number', 'amount'] as const;
export type LedgerSort = (typeof LEDGER_SORTS)[number];

/** What a record is sorted by; `date` is null while still to come. */
export interface LedgerKey {
  date: string | null;
  number: number;
  amount: number;
}

/** By date the list is grouped by day; by number or amount it is one list. */
export const groupsByDay = (sort: LedgerSort): boolean =>
  sort === 'newest' || sort === 'oldest';

/**
 * Sorted for the list. By date, records still to come go last either way:
 * they stay for weeks and would otherwise push today down.
 */
export function sortLedger<T>(
  records: readonly T[],
  sort: LedgerSort,
  key: (record: T) => LedgerKey,
): T[] {
  const byNumber = (a: LedgerKey, b: LedgerKey) => b.number - a.number;
  const compare: Record<LedgerSort, (a: LedgerKey, b: LedgerKey) => number> = {
    newest: (a, b) =>
      (b.date ?? '0000').localeCompare(a.date ?? '0000') || byNumber(a, b),
    oldest: (a, b) =>
      Number(a.date === null) - Number(b.date === null) ||
      (a.date ?? '').localeCompare(b.date ?? '') ||
      -byNumber(a, b),
    number: byNumber,
    amount: (a, b) => b.amount - a.amount || byNumber(a, b),
  };
  return records
    .map((record) => ({ record, key: key(record) }))
    .sort((a, b) => compare[sort](a.key, b.key))
    .map(({ record }) => record);
}
