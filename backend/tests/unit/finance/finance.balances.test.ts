import { describe, expect, it } from 'vitest';
import {
  type BalanceExpense,
  type BalancePayout,
  computeBalances,
  computeCategoryTotals,
  summarizeFees,
  summaryResults,
  summarizeIncome,
} from '#app/finance/finance.balances';

const expense = (overrides: Partial<BalanceExpense>): BalanceExpense => ({
  type: 'EXPENSE',
  amount: 1000,
  paidOn: '2026-07-20',
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

  it('moves no balance for an invoice still to pay', () => {
    const balances = computeBalances(
      [
        expense({ amount: 5000, paidByUserId: 'lena', paidByName: 'Lena' }),
        expense({
          amount: 9000,
          paidOn: null,
          paidByUserId: 'lena',
          paidByName: 'Lena',
        }),
      ],
      [],
    );

    expect(balances).toEqual([
      expect.objectContaining({ userId: 'lena', paid: 5000, balance: 5000 }),
    ]);
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

describe('summarizeIncome', () => {
  it('splits received from promised income per category', () => {
    const summary = summarizeIncome([
      { amount: 300_00, receivedOn: '2026-05-01', categoryId: 'grants' },
      { amount: 150_00, receivedOn: null, categoryId: 'grants' },
      { amount: 50_00, receivedOn: '2026-05-02', categoryId: null },
    ]);

    expect(summary).toEqual({
      incomeReceived: 350_00,
      incomeExpected: 150_00,
      incomeByCategory: [
        { categoryId: 'grants', received: 300_00, expected: 150_00, count: 2 },
        { categoryId: null, received: 50_00, expected: 0, count: 1 },
      ],
    });
  });

  it('is zero without any income', () => {
    expect(summarizeIncome([])).toEqual({
      incomeReceived: 0,
      incomeExpected: 0,
      incomeByCategory: [],
    });
  });
});

describe('summarizeFees', () => {
  const paid = (amount: number, refunded = 0, reduction = 0) => ({
    amount,
    refunds: refunded
      ? [{ amount: refunded, amountDueReduction: reduction }]
      : [],
  });
  const registration = (
    group: string | null,
    quotedAmount: number | null,
    payments: ReturnType<typeof paid>[] = [],
    { accepted = true, currency = 'EUR' } = {},
  ) => ({
    group,
    accepted,
    currency,
    quotedAmount,
    amountDueOverride: null,
    payments,
  });

  it('totals received per group and currency, adding up only the event currency', () => {
    const summary = summarizeFees(
      [
        {
          amount: 200_00,
          currency: 'EUR',
          registration: { group: 'de' },
          refunds: [{ amount: 50_00 }],
        },
        {
          amount: 200_00,
          currency: 'EUR',
          registration: { group: 'de' },
          refunds: [],
        },
        {
          amount: 800_00,
          currency: 'PLN',
          registration: { group: 'pl' },
          refunds: [],
        },
        { amount: 100_00, currency: 'EUR', registration: null, refunds: [] },
      ],
      [],
      'EUR',
    );

    expect(summary).toEqual({
      feesReceived: 450_00,
      feesOutstanding: 0,
      feesToRefund: 0,
      feesByGroup: [
        {
          group: 'de',
          currency: 'EUR',
          received: 350_00,
          outstanding: 0,
          toRefund: 0,
        },
        {
          group: 'pl',
          currency: 'PLN',
          received: 800_00,
          outstanding: 0,
          toRefund: 0,
        },
        {
          group: null,
          currency: 'EUR',
          received: 100_00,
          outstanding: 0,
          toRefund: 0,
        },
      ],
    });
  });

  it('counts what accepted registrations still owe and what is to be paid back', () => {
    const summary = summarizeFees(
      [],
      [
        registration('de', 200_00, [paid(50_00)]),
        registration('de', 200_00, [paid(250_00)]),
        // Not accepted: owes nothing.
        registration('de', 200_00, [], { accepted: false }),
        registration('de', 200_00, [paid(30_00)], { accepted: false }),
        registration('pl', 900_00, [], { currency: 'PLN' }),
      ],
      'EUR',
    );

    expect(summary.feesOutstanding).toBe(150_00);
    expect(summary.feesToRefund).toBe(50_00);
    expect(summary.feesByGroup).toContainEqual({
      group: 'pl',
      currency: 'PLN',
      received: 0,
      outstanding: 900_00,
      toRefund: 0,
    });
  });
});

describe('summaryResults', () => {
  it('expects promised income and owed fees; the cash view leaves them out', () => {
    expect(
      summaryResults({
        incomeReceived: 300_00,
        incomeExpected: 100_00,
        feesReceived: 1_000_00,
        feesOutstanding: 400_00,
        feesToRefund: 50_00,
        total: 900_00,
      }),
    ).toEqual({ receivedResult: 400_00, result: 850_00 });
  });
});
