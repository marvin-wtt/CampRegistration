import { describe, expect, it } from 'vitest';
import { type LedgerKey, sortLedger } from './ledgerSort';

const r = (number: number, date: string | null, amount = 100): LedgerKey => ({
  number,
  date,
  amount,
});
const sorted = (list: LedgerKey[], sort: Parameters<typeof sortLedger>[1]) =>
  sortLedger(list, sort, (x) => x).map((x) => x.number);

describe('sortLedger', () => {
  const list = [
    r(1, '2027-07-01', 50),
    r(2, null, 900),
    r(3, '2027-07-03', 300),
    r(4, '2027-07-01', 200),
  ];

  it('newest first, still to come last', () => {
    expect(sorted(list, 'newest')).toEqual([3, 4, 1, 2]);
  });

  it('oldest first, still to come last', () => {
    expect(sorted(list, 'oldest')).toEqual([1, 4, 3, 2]);
  });

  it('by number and by amount', () => {
    expect(sorted(list, 'number')).toEqual([4, 3, 2, 1]);
    expect(sorted(list, 'amount')).toEqual([2, 3, 4, 1]);
  });
});
