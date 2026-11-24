import type { EventManagerRole } from './EventManager.js';

/**
 * One person's standing with the event, in minor units. People are grouped by
 * user id, else by exact name. `balance` = paid − refunds − paidOut + paidBack:
 * positive, the event owes them; negative, they owe the event.
 */
export interface FinanceBalance {
  userId: string | null;
  name: string;
  paid: number;
  refunds: number;
  paidOut: number;
  paidBack: number;
  balance: number;
  /** Payouts agreed but not made yet: still to transfer, still to come back. */
  toPay: number;
  toReceive: number;
  /**
   * What is left to arrange: `balance` − toPay + toReceive. Settling and the
   * status go by this, so an agreed payout isn't offered twice.
   */
  open: number;
}

export interface FinanceCategoryTotal {
  /** `null` collects expenses without a category. */
  categoryId: string | null;
  expenses: number;
  refunds: number;
  total: number;
  count: number;
}

export interface FinanceIncomeCategoryTotal {
  /** `null` collects income without a category. */
  categoryId: string | null;
  received: number;
  /** Promised, not paid yet. */
  expected: number;
  count: number;
}

export interface FinanceFeeGroupTotal {
  /** `null` for payments without a group, e.g. of a deleted registration. */
  group: string | null;
  currency: string;
  /** Net of refunds, in `currency`. */
  received: number;
  /** Still owed by accepted registrations. */
  outstanding: number;
  /** Paid beyond what is due: to be paid back. */
  toRefund: number;
}

export interface FinanceSummary {
  currency: string;
  expenses: number;
  refunds: number;
  /** expenses − refunds */
  total: number;
  /** Sum of positive balances. */
  owedToPeople: number;
  /** Sum of negative balances, as a positive amount. */
  owedToEvent: number;
  /** Payouts agreed but not transferred yet. */
  toTransfer: number;
  /** Gross, before refunds. */
  paidByPeople: number;
  paidByFunds: number;
  receiptCount: number;
  receiptsWithoutFile: number[];
  /** Receipt numbers whose receipt is still to come (no date yet). */
  receiptsPending: number[];
  byCategory: FinanceCategoryTotal[];
  /** Grants, donations and the like that have arrived. */
  incomeReceived: number;
  /** The same, promised but not paid yet. */
  incomeExpected: number;
  /**
   * Registration fees received, net of refunds. Payments in another currency
   * than the event's are left out; they can't be added up.
   */
  feesReceived: number;
  /** Still owed by accepted registrations, event currency only. */
  feesOutstanding: number;
  /** Overpaid and to be paid back, event currency only. */
  feesToRefund: number;
  /**
   * Fees received per group, each in its own currency — a group paying in
   * another currency is shown, never converted.
   */
  feesByGroup: FinanceFeeGroupTotal[];
  incomeByCategory: FinanceIncomeCategoryTotal[];
  /**
   * What the event will end with: all income and fees expected, promised
   * and still owed included, − `total`.
   */
  result: number;
  /** The same from what has arrived only: the cash view. */
  receivedResult: number;
}

export interface FinanceSettings {
  payoutNumberPrefix: string;
  /** The prefix is fixed once a payout exists, so printed slips keep matching. */
  payoutNumberPrefixLocked: boolean;
  incomeNumberPrefix: string;
  /** Likewise, once an income exists: filed documents carry its number. */
  incomeNumberPrefixLocked: boolean;
}

export interface FinanceSettingsUpdateData {
  payoutNumberPrefix?: string | undefined;
  incomeNumberPrefix?: string | undefined;
}

/** Who can be picked as payer or recipient: managers first, then names typed before. */
export interface FinanceParties {
  managers: { userId: string; name: string; role: EventManagerRole }[];
  /** Free-text names already used in the event's expenses and payouts. */
  names: string[];
  /** The requester's own user id: the default payer. */
  selfUserId: string;
}
