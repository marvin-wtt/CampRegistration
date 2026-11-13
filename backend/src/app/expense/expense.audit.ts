import {
  changedKeysByAllowList,
  changedValues,
  composeDetails,
} from '#app/audit/audit.diff';
import type { AuditChangePolicy } from '#app/audit/audit.policy';
import type { Expense } from '#generated/prisma/client';
import type { AuditDetails } from '@camp-registration/common/entities';

const FIELD_ALLOWLIST: (keyof Expense)[] = [
  'type',
  'amount',
  'originalAmount',
  'originalCurrency',
  'date',
  'description',
  'categoryId',
  'paidByUserId',
  'paidByName',
];

// Amounts, type and date are what a treasurer reconciles; names and
// descriptions only appear as changed fields.
const VALUE_KEYS = ['type', 'amount', 'date'] as const;

type AuditedExpense = Expense & { files?: { id: string }[] };

export const expenseAuditPolicy: AuditChangePolicy<AuditedExpense> = {
  entityType: 'expense',

  locate: (expense) => ({ entityId: expense.id, eventId: expense.eventId }),
  identity: expenseIdentity,

  details(before, after) {
    const fields = changedKeysByAllowList(before, after, FIELD_ALLOWLIST);
    if (filesChanged(before, after)) {
      fields.push('files');
    }
    if (fields.length === 0) {
      return {};
    }

    return composeDetails({
      changedFields: fields,
      values: changedValues(before, after, VALUE_KEYS),
      ...expenseIdentity(after ?? before),
    });
  },
};

function expenseIdentity(
  expense:
    Pick<Expense, 'receiptNumber' | 'amount' | 'type'> | null | undefined,
): AuditDetails {
  if (!expense) {
    return {};
  }

  return {
    context: {
      receiptNumber: expense.receiptNumber,
      type: expense.type,
      amount: expense.amount,
    },
  };
}

function filesChanged(
  before: AuditedExpense | null | undefined,
  after: AuditedExpense | null | undefined,
): boolean {
  const ids = (expense: AuditedExpense | null | undefined) =>
    (expense?.files ?? [])
      .map((file) => file.id)
      .sort()
      .join();

  return ids(before) !== ids(after);
}
