import type {
  FinanceBalance,
  FinanceCategoryTotal,
} from '@camp-registration/common/entities';

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

/** People group by account, else by exact name. */
function partyKey(userId: string | null, name: string | null): string | null {
  if (userId) {
    return `user:${userId}`;
  }
  return name ? `name:${name}` : null;
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
