import { describe, expect, it } from 'vitest';
import {
  type BalanceExpense,
  type BalancePayout,
  computeBalances,
  computeCategoryTotals,
} from '#app/finance/finance.balances';

const expense = (overrides: Partial<BalanceExpense>): BalanceExpense => ({
  type: 'EXPENSE',
  amount: 1000,
  categoryId: 'food',
  paidByUserId: null,
  paidByName: null,
  ...overrides,
});

const payout = (overrides: Partial<BalancePayout>): BalancePayout => ({
  direction: 'OUT',
  amount: 1000,
  paidOn: '2026-07-28',
  recipientUserId: null,
  recipientName: 'Someone',
  ...overrides,
});

describe('computeBalances', () => {
  it('owes a person what they paid, minus payouts', () => {
    const balances = computeBalances(
      [
        expense({ amount: 41200, paidByUserId: 'lena', paidByName: 'Lena W.' }),
        expense({ amount: 72145, paidByUserId: 'lena', paidByName: 'Lena W.' }),
      ],
      [
        payout({
          amount: 60000,
          recipientUserId: 'lena',
          recipientName: 'Lena W.',
        }),
      ],
    );

    expect(balances).toEqual([
      {
        userId: 'lena',
        name: 'Lena W.',
        paid: 113345,
        refunds: 0,
        paidOut: 60000,
        paidBack: 0,
        balance: 53345,
        toPay: 0,
        toReceive: 0,
        open: 53345,
      },
    ]);
  });

  it('settles an advance plus a refund the person received', () => {
    const [jonas] = computeBalances(
      [
        expense({ amount: 34915, paidByUserId: 'jonas', paidByName: 'Jonas' }),
        expense({
          type: 'REFUND',
          amount: 1240,
          paidByUserId: 'jonas',
          paidByName: 'Jonas',
        }),
      ],
      [
        payout({
          amount: 20000,
          recipientUserId: 'jonas',
          recipientName: 'Jonas',
        }),
        payout({
          amount: 13675,
          recipientUserId: 'jonas',
          recipientName: 'Jonas',
        }),
      ],
    );

    expect(jonas?.balance).toBe(0);
  });

  it('goes negative when an advance exceeds the expenses', () => {
    const [tomasz] = computeBalances(
      [expense({ amount: 18400, paidByName: 'Tomasz' })],
      [payout({ amount: 25000, recipientName: 'Tomasz' })],
    );

    expect(tomasz?.balance).toBe(-6600);
  });

  it('adds money handed back', () => {
    const [marie] = computeBalances(
      [],
      [
        payout({ amount: 5000, recipientName: 'Marie' }),
        payout({ direction: 'IN', amount: 1200, recipientName: 'Marie' }),
      ],
    );

    expect(marie).toMatchObject({
      paidOut: 5000,
      paidBack: 1200,
      balance: -3800,
    });
  });

  it('leaves nothing open once the payout is agreed', () => {
    const [lena] = computeBalances(
      [expense({ amount: 8865, paidByName: 'Lena' })],
      [payout({ amount: 5000, recipientName: 'Lena', paidOn: null })],
    );

    expect(lena).toMatchObject({ balance: 8865, toPay: 5000, open: 3865 });
  });

  it('settles nothing with a payout not made yet', () => {
    const [lena] = computeBalances(
      [expense({ amount: 8865, paidByName: 'Lena' })],
      [
        payout({ amount: 8865, recipientName: 'Lena', paidOn: null }),
        payout({
          direction: 'IN',
          amount: 500,
          recipientName: 'Lena',
          paidOn: null,
        }),
      ],
    );

    expect(lena).toMatchObject({
      balance: 8865,
      paidOut: 0,
      toPay: 8865,
      toReceive: 500,
    });
  });

  it('moves no balance for event funds', () => {
    expect(computeBalances([expense({ amount: 50000 })], [])).toEqual([]);
  });

  it('groups by account first and by exact name otherwise', () => {
    const balances = computeBalances(
      [
        expense({ paidByUserId: 'u1', paidByName: 'Lena' }),
        expense({ paidByUserId: 'u1', paidByName: 'Lena Weber' }),
        expense({ paidByName: 'Club' }),
        expense({ paidByName: 'club' }),
      ],
      [],
    );

    expect(balances.map((b) => [b.name, b.paid])).toEqual([
      ['club', 1000],
      ['Club', 1000],
      // The latest snapshot names the account.
      ['Lena Weber', 2000],
    ]);
  });
});

describe('computeCategoryTotals', () => {
  it('nets refunds against their category', () => {
    const totals = computeCategoryTotals([
      expense({ categoryId: 'house', amount: 50000 }),
      expense({ categoryId: 'house', type: 'REFUND', amount: 50000 }),
      expense({ categoryId: null, amount: 2375 }),
    ]);

    expect(totals).toEqual([
      {
        categoryId: 'house',
        expenses: 50000,
        refunds: 50000,
        total: 0,
        count: 2,
      },
      { categoryId: null, expenses: 2375, refunds: 0, total: 2375, count: 1 },
    ]);
  });
});
