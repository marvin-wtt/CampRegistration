import { describe, expect, it } from 'vitest';
import type { Expense, Payout } from '@camp-registration/common/entities';
import { buildPayoutStatement } from '@/utils/payoutStatement';

const expense = (overrides: Partial<Expense>): Expense => ({
  id: String(overrides.receiptNumber ?? 1),
  receiptNumber: 1,
  type: 'EXPENSE',
  amount: 1000,
  originalAmount: null,
  originalCurrency: null,
  date: '2026-07-20',
  description: 'Groceries',
  categoryId: null,
  paidByUserId: 'lena',
  paidByName: 'Lena',
  createdByUserId: 'lena',
  owned: false,
  files: [],
  createdAt: '2026-07-20T10:00:00Z',
  ...overrides,
});

const payout = (overrides: Partial<Payout>): Payout => ({
  id: `p${String(overrides.number ?? 1)}`,
  number: 1,
  label: 'P1',
  recipientUserId: 'lena',
  recipientName: 'Lena',
  direction: 'OUT',
  amount: 1000,
  paidOn: '2026-07-28',
  note: null,
  signature: null,
  signedAt: null,
  createdByUserId: null,
  createdByName: null,
  owned: false,
  createdAt: '2026-07-28T10:00:00Z',
  ...overrides,
});

describe('buildPayoutStatement', () => {
  it('lists only the recipient’s receipts and settles the balance', () => {
    const expenses = [
      expense({ receiptNumber: 3, amount: 15210 }),
      expense({ receiptNumber: 1, amount: 41200 }),
      expense({ receiptNumber: 2, paidByUserId: 'jonas', paidByName: 'Jonas' }),
      expense({ receiptNumber: 4, type: 'REFUND', amount: 1240 }),
    ];
    const advance = payout({ number: 1, amount: 20000 });
    const settle = payout({ number: 2, amount: 35170 });

    const statement = buildPayoutStatement(settle, expenses, [advance, settle]);

    expect(statement.expenses.map((e) => e.receiptNumber)).toEqual([1, 3, 4]);
    expect(statement).toMatchObject({
      paid: 56410,
      refunds: 1240,
      before: 35170,
      after: 0,
    });
    expect(statement.earlier).toEqual([advance]);
  });

  it('matches a person without an account by exact name', () => {
    const statement = buildPayoutStatement(
      payout({ recipientUserId: null, recipientName: 'Club' }),
      [
        expense({ paidByUserId: null, paidByName: 'Club', amount: 5000 }),
        expense({ paidByUserId: null, paidByName: 'club', amount: 9000 }),
      ],
      [],
    );

    expect(statement.paid).toBe(5000);
  });

  it('adds money handed back', () => {
    const statement = buildPayoutStatement(
      payout({ direction: 'IN', amount: 6600 }),
      [],
      [],
    );

    expect(statement.after).toBe(6600);
  });
});
