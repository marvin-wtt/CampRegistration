import type {
  FinanceBalance,
  FinanceCategoryTotal,
  FinanceFeeGroupTotal,
  FinanceIncomeCategoryTotal,
  FinanceSummary,
} from '@camp-registration/common/entities';
import {
  type PaymentLedgerEntry,
  partyKey,
  paymentBalance,
} from '@camp-registration/common/utils';

export interface BalanceExpense {
  type: 'EXPENSE' | 'REFUND';
  amount: number;
  categoryId: string | null;
  paidByUserId: string | null;
  paidByName: string | null;
}

export interface BalancePayout {
  direction: 'OUT' | 'IN';
  amount: number;
  /** `null` while agreed but not made: it moves no balance yet. */
  paidOn: string | null;
  recipientUserId: string | null;
  recipientName: string;
}

/**
 * balance = paid − refunds received − paid out + paid back. Expenses paid
 * from event funds move nobody's balance. Records come oldest first, so the
 * latest name snapshot wins for an account.
 */
export function computeBalances(
  expenses: readonly BalanceExpense[],
  payouts: readonly BalancePayout[],
): FinanceBalance[] {
  const balances = new Map<string, FinanceBalance>();

  const entry = (userId: string | null, name: string) => {
    const key = partyKey(userId, name);
    if (key === null) {
      return null;
    }
    const existing = balances.get(key);
    if (existing) {
      existing.name = name;
      return existing;
    }
    const created: FinanceBalance = {
      userId,
      name,
      paid: 0,
      refunds: 0,
      paidOut: 0,
      paidBack: 0,
      balance: 0,
      toPay: 0,
      toReceive: 0,
      open: 0,
    };
    balances.set(key, created);
    return created;
  };

  for (const expense of expenses) {
    const balance = entry(expense.paidByUserId, expense.paidByName ?? '');
    if (!balance || (!expense.paidByUserId && !expense.paidByName)) {
      continue;
    }
    if (expense.type === 'REFUND') {
      balance.refunds += expense.amount;
    } else {
      balance.paid += expense.amount;
    }
  }

  for (const payout of payouts) {
    const balance = entry(payout.recipientUserId, payout.recipientName);
    if (!balance) {
      continue;
    }
    if (payout.paidOn === null) {
      if (payout.direction === 'OUT') {
        balance.toPay += payout.amount;
      } else {
        balance.toReceive += payout.amount;
      }
    } else if (payout.direction === 'OUT') {
      balance.paidOut += payout.amount;
    } else {
      balance.paidBack += payout.amount;
    }
  }

  return [...balances.values()]
    .map((b) => {
      const balance = b.paid - b.refunds - b.paidOut + b.paidBack;
      return { ...b, balance, open: balance - b.toPay + b.toReceive };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Refunds subtract from their category; `null` collects the uncategorized. */
export function computeCategoryTotals(
  expenses: readonly BalanceExpense[],
): FinanceCategoryTotal[] {
  const totals = new Map<string | null, FinanceCategoryTotal>();

  for (const expense of expenses) {
    const total = totals.get(expense.categoryId) ?? {
      categoryId: expense.categoryId,
      expenses: 0,
      refunds: 0,
      total: 0,
      count: 0,
    };
    if (expense.type === 'REFUND') {
      total.refunds += expense.amount;
    } else {
      total.expenses += expense.amount;
    }
    total.total = total.expenses - total.refunds;
    total.count += 1;
    totals.set(expense.categoryId, total);
  }

  return [...totals.values()];
}

export interface SummaryIncome {
  amount: number;
  /** `null` while promised but not paid yet. */
  receivedOn: string | null;
  categoryId: string | null;
}

/**
 * The income half of the summary. The result counts only money that has
 * arrived, so a promise never makes the event look better off than it is.
 */
export function summarizeIncome(
  incomes: readonly SummaryIncome[],
): Pick<
  FinanceSummary,
  'incomeReceived' | 'incomeExpected' | 'incomeByCategory'
> {
  const byCategory = new Map<string | null, FinanceIncomeCategoryTotal>();
  let received = 0;
  let expected = 0;

  for (const income of incomes) {
    const total = byCategory.get(income.categoryId) ?? {
      categoryId: income.categoryId,
      received: 0,
      expected: 0,
      count: 0,
    };
    if (income.receivedOn) {
      total.received += income.amount;
      received += income.amount;
    } else {
      total.expected += income.amount;
      expected += income.amount;
    }
    total.count += 1;
    byCategory.set(income.categoryId, total);
  }

  return {
    incomeReceived: received,
    incomeExpected: expected,
    incomeByCategory: [...byCategory.values()],
  };
}

export interface SummaryFeePayment {
  amount: number;
  currency: string;
  /** `null` once the registration is deleted. */
  registration: { group: string | null } | null;
  refunds: { amount: number }[];
}

/** A registration as far as its fee balance needs it. */
export interface SummaryFeeRegistration {
  group: string | null;
  accepted: boolean;
  currency: string;
  quotedAmount: number | null;
  amountDueOverride: number | null;
  payments: PaymentLedgerEntry[];
}

type FeeSummary = Pick<
  FinanceSummary,
  'feesReceived' | 'feesOutstanding' | 'feesToRefund' | 'feesByGroup'
>;

/**
 * Fees per group and currency: received net of refunds (payments of deleted
 * registrations included), still owed by accepted registrations, and to be
 * paid back. Only the event's currency adds up; others are never converted.
 */
export function summarizeFees(
  payments: readonly SummaryFeePayment[],
  registrations: readonly SummaryFeeRegistration[],
  eventCurrency: string,
): FeeSummary {
  const byGroup = new Map<string, FinanceFeeGroupTotal>();
  const totalFor = (group: string | null, currency: string) => {
    const key = `${group ?? ''}|${currency}`;
    const total = byGroup.get(key) ?? {
      group,
      currency,
      received: 0,
      outstanding: 0,
      toRefund: 0,
    };
    byGroup.set(key, total);
    return total;
  };

  for (const payment of payments) {
    totalFor(payment.registration?.group ?? null, payment.currency).received +=
      payment.amount -
      payment.refunds.reduce((sum, refund) => sum + refund.amount, 0);
  }
  for (const registration of registrations) {
    const balance = paymentBalance(
      registration,
      registration.currency,
      registration.payments,
    );
    if (!registration.accepted && balance.overpaid === 0) {
      continue;
    }
    const total = totalFor(registration.group, registration.currency);
    total.outstanding += registration.accepted ? balance.outstanding : 0;
    total.toRefund += balance.overpaid;
  }

  const own = [...byGroup.values()].filter((t) => t.currency === eventCurrency);
  const sum = (pick: (t: FinanceFeeGroupTotal) => number) =>
    own.reduce((total, t) => total + pick(t), 0);

  return {
    feesReceived: sum((t) => t.received),
    feesOutstanding: sum((t) => t.outstanding),
    feesToRefund: sum((t) => t.toRefund),
    feesByGroup: [...byGroup.values()],
  };
}

/** Expected and received result, from the totals of the summary. */
export function summaryResults(
  totals: Pick<
    FinanceSummary,
    | 'incomeReceived'
    | 'incomeExpected'
    | 'feesReceived'
    | 'feesOutstanding'
    | 'feesToRefund'
    | 'total'
  >,
): Pick<FinanceSummary, 'result' | 'receivedResult'> {
  const receivedResult =
    totals.incomeReceived + totals.feesReceived - totals.total;

  return {
    receivedResult,
    result:
      receivedResult +
      totals.incomeExpected +
      totals.feesOutstanding -
      totals.feesToRefund,
  };
}
