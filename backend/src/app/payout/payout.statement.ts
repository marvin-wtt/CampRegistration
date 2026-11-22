import { z } from 'zod';
import i18n from '#core/i18n/i18n.client';
import {
  allGroupValues,
  formatMoney,
  payerKey,
  recipientKey,
  translate,
} from '@camp-registration/common/utils';
import type {
  ExpenseType,
  PayoutDirection,
  PayoutStatementContent,
  PerGroup,
  Translatable,
} from '@camp-registration/common/entities';

export interface StatementExpense {
  id: string;
  receiptNumber: number;
  type: ExpenseType;
  amount: number;
  date: string | null;
  description: string;
  paidByUserId: string | null;
  paidByName: string | null;
}

export interface StatementPayout {
  id: string;
  number: number;
  direction: PayoutDirection;
  amount: number;
  paidOn: string | null;
  recipientUserId: string | null;
  recipientName: string;
  createdAt: Date;
}

/**
 * What the outdated check compares: the figures only. A receipt's date or
 * description may still change without invalidating the slip.
 */
interface PayoutStatementBasis {
  /** The event's last receipt number at creation: later ones aren't listed. */
  receiptsUpTo: number;
  expenses: {
    id: string;
    receiptNumber: number;
    type: ExpenseType;
    amount: number;
  }[];
  payouts: { id: string; direction: PayoutDirection; amount: number }[];
}

/** What `Payout.statement` holds. */
export interface FrozenStatement {
  content: PayoutStatementContent;
  basis: PayoutStatementBasis;
}

const line = z.object({
  label: z.string(),
  amount: z.string(),
  strong: z.boolean().optional(),
});

// What a payout row is expected to hold; checked on read, not trusted.
const FrozenStatementSchema = z.object({
  content: z.object({
    locale: z.string(),
    eventName: z.string(),
    organizer: z.string(),
    createdOn: z.string(),
    expenses: z.array(
      z.object({
        number: z.string(),
        date: z.string(),
        description: z.string(),
        amount: z.string(),
      }),
    ),
    totals: z.array(line),
    balanceAfter: line,
    declaration: z.string(),
  }),
  basis: z.object({
    receiptsUpTo: z.number().int(),
    expenses: z.array(
      z.object({
        id: z.string(),
        receiptNumber: z.number().int(),
        type: z.enum(['EXPENSE', 'REFUND']),
        amount: z.number().int(),
      }),
    ),
    payouts: z.array(
      z.object({
        id: z.string(),
        direction: z.enum(['OUT', 'IN']),
        amount: z.number().int(),
      }),
    ),
  }),
}) satisfies z.ZodType<FrozenStatement>;

/** The stored statement, or a clear error if a row doesn't hold one. */
export function readStatement(json: unknown): FrozenStatement {
  return FrozenStatementSchema.parse(json);
}

interface Statement {
  receiptsUpTo: number;
  expenses: StatementExpense[];
  earlier: StatementPayout[];
  paid: number;
  refunds: number;
  /** Balance before this payout: paid − refunds − earlier out + earlier in. */
  before: number;
  after: number;
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const moved = (list: Pick<StatementPayout, 'direction' | 'amount'>[]) =>
  sum(list.map((p) => (p.direction === 'OUT' ? -p.amount : p.amount)));

/**
 * The recipient's receipts and earlier payouts as of the payout's creation:
 * what they confirm. Later records belong to later statements; receipts go
 * by number, which no clock can skew.
 */
export function buildPayoutStatement(
  payout: StatementPayout,
  expenses: readonly StatementExpense[],
  payouts: readonly StatementPayout[],
  receiptsUpTo: number,
): Statement {
  const recipient = recipientKey(payout);
  const own = expenses
    .filter((e) => e.receiptNumber <= receiptsUpTo && payerKey(e) === recipient)
    .sort((a, b) => a.receiptNumber - b.receiptNumber);
  const earlier = payouts
    .filter((p) => p.number < payout.number && recipientKey(p) === recipient)
    .sort((a, b) => a.number - b.number);

  const paid = sum(
    own.filter((e) => e.type === 'EXPENSE').map((e) => e.amount),
  );
  const refunds = sum(
    own.filter((e) => e.type === 'REFUND').map((e) => e.amount),
  );
  const before = paid - refunds + moved(earlier);

  return {
    receiptsUpTo,
    expenses: own,
    earlier,
    paid,
    refunds,
    before,
    after: before + moved([payout]),
  };
}

function statementBasis(statement: Statement): PayoutStatementBasis {
  return {
    receiptsUpTo: statement.receiptsUpTo,
    expenses: statement.expenses.map((e) => ({
      id: e.id,
      receiptNumber: e.receiptNumber,
      type: e.type,
      amount: e.amount,
    })),
    payouts: statement.earlier.map((p) => ({
      id: p.id,
      direction: p.direction,
      amount: p.amount,
    })),
  };
}

/** Field by field: the database doesn't keep a JSON object's key order. */
function sameBasis(a: PayoutStatementBasis, b: PayoutStatementBasis): boolean {
  return (
    a.receiptsUpTo === b.receiptsUpTo &&
    a.expenses.length === b.expenses.length &&
    a.payouts.length === b.payouts.length &&
    a.expenses.every((e, i) => {
      // Same length, checked above.
      const other = b.expenses[i];
      return (
        e.id === other.id &&
        e.receiptNumber === other.receiptNumber &&
        e.type === other.type &&
        e.amount === other.amount
      );
    }) &&
    a.payouts.every((p, i) => {
      const other = b.payouts[i];
      return (
        p.id === other.id &&
        p.direction === other.direction &&
        p.amount === other.amount
      );
    })
  );
}

export interface StatementContext {
  locale: string;
  currency: string;
  timezone: string;
  payoutNumberPrefix: string;
  eventName: Translatable;
  organizer: PerGroup<string>;
}

/** The slip's text, formatted once; it is printed as is from then on. */
function renderStatementContent(
  payout: StatementPayout,
  statement: Statement,
  context: StatementContext,
): PayoutStatementContent {
  const { locale } = context;
  const t = i18n.getFixedT(locale, 'finance', 'statement');
  const money = (minor: number) => formatMoney(minor, context.currency, locale);
  const numeric = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  } as const;
  // `YYYY-MM-DD` is a calendar date: formatted in UTC, it never shifts a day.
  const day = (value: string) =>
    new Intl.DateTimeFormat(locale, { ...numeric, timeZone: 'UTC' }).format(
      new Date(`${value}T00:00:00Z`),
    );
  const label = (p: Pick<StatementPayout, 'number'>) =>
    `${context.payoutNumberPrefix}${p.number.toString()}`;
  const sign = (p: Pick<StatementPayout, 'direction' | 'amount'>) =>
    `${p.direction === 'OUT' ? '−' : '+'}${money(p.amount)}`;

  const eventName = translate(context.eventName, locale) ?? '';

  return {
    locale,
    eventName,
    // A payout belongs to no group, so the slip names every group's organizer.
    organizer: allGroupValues(context.organizer).filter(Boolean).join(' / '),
    createdOn: new Intl.DateTimeFormat(locale, {
      ...numeric,
      timeZone: context.timezone,
    }).format(payout.createdAt),
    expenses: statement.expenses.map((e) => ({
      number: `#${e.receiptNumber.toString()}`,
      date: e.date ? day(e.date) : t('receiptPending'),
      description: e.description,
      amount: money(e.type === 'REFUND' ? -e.amount : e.amount),
    })),
    totals: [
      { label: t('paid'), amount: money(statement.paid) },
      ...(statement.refunds > 0
        ? [{ label: t('refunds'), amount: `−${money(statement.refunds)}` }]
        : []),
      ...statement.earlier.map((p) => ({
        // A status would go stale once it is paid; a date stays true.
        label: p.paidOn ? `${label(p)} · ${day(p.paidOn)}` : label(p),
        amount: sign(p),
      })),
      { label: t('open'), amount: money(statement.before), strong: true },
      {
        label: `${label(payout)} · ${t(payout.direction)}`,
        amount: sign(payout),
        strong: true,
      },
    ],
    balanceAfter: { label: t('balanceAfter'), amount: money(statement.after) },
    declaration: t('declaration', {
      event: eventName,
    }),
  };
}

/** Freezes a new payout's statement: the slip text and what it rests on. */
export function freezeStatement(
  payout: StatementPayout,
  expenses: readonly StatementExpense[],
  payouts: readonly StatementPayout[],
  receiptsUpTo: number,
  context: StatementContext,
): FrozenStatement {
  const statement = buildPayoutStatement(
    payout,
    expenses,
    payouts,
    receiptsUpTo,
  );

  return {
    content: renderStatementContent(payout, statement, context),
    basis: statementBasis(statement),
  };
}

/** Whether the data behind a frozen statement has changed since. */
export function isStatementOutdated(
  payout: StatementPayout & { statement: unknown },
  expenses: readonly StatementExpense[],
  payouts: readonly StatementPayout[],
): boolean {
  const frozen = readStatement(payout.statement);
  const current = statementBasis(
    buildPayoutStatement(payout, expenses, payouts, frozen.basis.receiptsUpTo),
  );

  return !sameBasis(frozen.basis, current);
}
