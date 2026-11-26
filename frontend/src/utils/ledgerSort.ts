/** What an expense or income list can be sorted by, in either direction. */
export const LEDGER_SORTS = ['date', 'number', 'amount'] as const;
export type LedgerSort = (typeof LEDGER_SORTS)[number];

/** What a record is sorted by; `date` is null while still to come. */
export interface LedgerKey {
  date: string | null;
  number: number;
  amount: number;
}

/** By date the list is grouped by day; by number or amount it is one list. */
export const groupsByDay = (sort: LedgerSort): boolean => sort === 'date';

/**
 * Sorted for the list. Records still to come go last either way: they stay
 * for weeks and would otherwise push today down. Ties go by number.
 */
export function sortLedger<T>(
  records: readonly T[],
  sort: LedgerSort,
  descending: boolean,
  key: (record: T) => LedgerKey,
): T[] {
  const byNumber = (a: LedgerKey, b: LedgerKey) => a.number - b.number;
  const ascending: Record<LedgerSort, (a: LedgerKey, b: LedgerKey) => number> =
    {
      date: (a, b) =>
        (a.date ?? '').localeCompare(b.date ?? '') || byNumber(a, b),
      number: byNumber,
      amount: (a, b) => a.amount - b.amount || byNumber(a, b),
    };
  const sign = descending ? -1 : 1;
  const compare = (a: LedgerKey, b: LedgerKey) =>
    (sort === 'date' ? Number(a.date === null) - Number(b.date === null) : 0) ||
    sign * ascending[sort](a, b);

  return records
    .map((record) => ({ record, key: key(record) }))
    .sort((a, b) => compare(a.key, b.key))
    .map(({ record }) => record);
}
