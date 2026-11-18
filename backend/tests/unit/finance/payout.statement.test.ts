import { beforeAll, describe, expect, it } from 'vitest';
import { initI18n } from '#core/i18n/i18n.client';
import {
  buildPayoutStatement,
  freezeStatement,
  isStatementOutdated,
  type StatementExpense,
  type StatementPayout,
} from '#app/payout/payout.statement';

const expense = (overrides: Partial<StatementExpense>): StatementExpense => ({
  id: `e${String(overrides.receiptNumber ?? 1)}`,
  receiptNumber: 1,
  type: 'EXPENSE',
  amount: 1000,
  date: '2026-07-20',
  description: 'Groceries',
  paidByUserId: 'lena',
  paidByName: 'Lena',
  ...overrides,
});

const payout = (overrides: Partial<StatementPayout>): StatementPayout => ({
  id: `p${String(overrides.number ?? 1)}`,
  number: 1,
  direction: 'OUT',
  amount: 1000,
  paidOn: '2026-07-28',
  recipientUserId: 'lena',
  recipientName: 'Lena',
  createdAt: new Date('2026-07-28T10:00:00Z'),
  ...overrides,
});

const context = {
  locale: 'de-DE',
  currency: 'EUR',
  timezone: 'Europe/Berlin',
  payoutNumberPrefix: 'P',
  eventName: 'Sommerlager',
  organizer: 'Verein',
};

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

    const statement = buildPayoutStatement(
      settle,
      expenses,
      [advance, settle],
      4,
    );

    expect(statement.expenses.map((e) => e.receiptNumber)).toEqual([1, 3, 4]);
    expect(statement).toMatchObject({
      paid: 56410,
      refunds: 1240,
      before: 35170,
      after: 0,
    });
    expect(statement.earlier).toEqual([advance]);
  });

  it('leaves out receipts numbered after the payout was made', () => {
    const statement = buildPayoutStatement(
      payout({}),
      [expense({ receiptNumber: 1 }), expense({ receiptNumber: 2 })],
      [],
      1,
    );

    expect(statement.expenses.map((e) => e.receiptNumber)).toEqual([1]);
  });

  it('matches a person without an account by exact name', () => {
    const statement = buildPayoutStatement(
      payout({ recipientUserId: null, recipientName: 'Club' }),
      [
        expense({ paidByUserId: null, paidByName: 'Club', amount: 5000 }),
        expense({ paidByUserId: null, paidByName: 'club', amount: 9000 }),
      ],
      [],
      10,
    );

    expect(statement.paid).toBe(5000);
  });

  it('adds money handed back', () => {
    const statement = buildPayoutStatement(
      payout({ direction: 'IN', amount: 6600 }),
      [],
      [],
      0,
    );

    expect(statement.after).toBe(6600);
  });
});

describe('frozen statements', () => {
  beforeAll(async () => {
    await initI18n();
  });

  const settle = payout({ number: 2, amount: 4780 });
  const expenses = [expense({ amount: 4780 })];
  const frozen = () => ({
    ...settle,
    statement: freezeStatement(settle, expenses, [], 1, context),
  });

  it('writes the slip as text in the creator’s language', () => {
    const { content } = frozen().statement;

    expect(content.createdOn).toBe('28.07.2026');
    expect(content.expenses).toEqual([
      {
        number: '#1',
        date: '20.07.2026',
        description: 'Groceries',
        amount: '47,80 €',
      },
    ]);
    expect(content.totals.at(-1)).toEqual({
      label: 'P2 · Auszahlung',
      amount: '−47,80 €',
      strong: true,
    });
    expect(content.balanceAfter.amount).toBe('0,00 €');
    expect(content.declaration).toContain('„Sommerlager“');
  });

  it('names the event in its language and every group’s organizer', () => {
    const { content } = freezeStatement(settle, expenses, [], 1, {
      ...context,
      eventName: { gb: 'Summer Camp', de: 'Sommerlager' },
      organizer: { de: 'Verein', fr: 'Association', gb: 'Verein' },
    });

    expect(content.eventName).toBe('Sommerlager');
    expect(content.organizer).toBe('Verein / Association');
  });

  it('is outdated only when its figures change', () => {
    const outdated = (list: StatementExpense[]) =>
      isStatementOutdated(frozen(), list, []);

    expect(outdated(expenses)).toBe(false);
    expect(outdated([...expenses, expense({ receiptNumber: 2 })])).toBe(false);
    expect(
      outdated([expense({ amount: 4780, date: null, description: 'Food' })]),
    ).toBe(false);
    expect(outdated([expense({ amount: 4000 })])).toBe(true);
    expect(outdated([expense({ amount: 4780, type: 'REFUND' })])).toBe(true);
    expect(outdated([expense({ amount: 4780, paidByUserId: 'jonas' })])).toBe(
      true,
    );
    expect(outdated([])).toBe(true);
  });

  it('is outdated when an earlier payout changes', () => {
    const advance = payout({ number: 1, amount: 2000 });
    const payout2 = {
      ...settle,
      statement: freezeStatement(settle, expenses, [advance], 1, context),
    };

    expect(isStatementOutdated(payout2, expenses, [advance])).toBe(false);
    expect(
      isStatementOutdated(payout2, expenses, [{ ...advance, paidOn: null }]),
    ).toBe(false);
    expect(isStatementOutdated(payout2, expenses, [])).toBe(true);
  });
});
