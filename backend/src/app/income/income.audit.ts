import {
  changedKeysByAllowList,
  changedValues,
  composeDetails,
} from '#app/audit/audit.diff';
import type { AuditChangePolicy } from '#app/audit/audit.policy';
import type { Income } from '#generated/prisma/client';
import type { AuditDetails } from '@camp-registration/common/entities';

const FIELD_ALLOWLIST: (keyof Income)[] = [
  'amount',
  'originalAmount',
  'originalCurrency',
  'receivedOn',
  'description',
  'payerName',
  'categoryId',
];

// Amount and arrival are what a treasurer reconciles; names and descriptions
// only appear as changed fields.
const VALUE_KEYS = ['amount', 'receivedOn'] as const;

type AuditedIncome = Income & { files?: { id: string }[] };

export const incomeAuditPolicy: AuditChangePolicy<AuditedIncome> = {
  entityType: 'income',

  locate: (income) => ({ entityId: income.id, eventId: income.eventId }),
  identity: incomeIdentity,

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
      ...incomeIdentity(after ?? before),
    });
  },
};

function incomeIdentity(
  income: Pick<Income, 'number' | 'amount'> | null | undefined,
): AuditDetails {
  if (!income) {
    return {};
  }

  return { context: { number: income.number, amount: income.amount } };
}

function filesChanged(
  before: AuditedIncome | null | undefined,
  after: AuditedIncome | null | undefined,
): boolean {
  const ids = (income: AuditedIncome | null | undefined) =>
    (income?.files ?? [])
      .map((file) => file.id)
      .sort()
      .join();

  return ids(before) !== ids(after);
}
