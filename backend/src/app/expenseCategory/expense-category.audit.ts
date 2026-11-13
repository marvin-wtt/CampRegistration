import { changedKeysByAllowList, composeDetails } from '#app/audit/audit.diff';
import type { AuditChangePolicy } from '#app/audit/audit.policy';
import type { ExpenseCategory } from '#generated/prisma/client';

const FIELD_ALLOWLIST: (keyof ExpenseCategory)[] = [
  'name',
  'parentId',
  'position',
  'archivedAt',
];

export const expenseCategoryAuditPolicy: AuditChangePolicy<ExpenseCategory> = {
  entityType: 'expenseCategory',

  locate: (category) => ({ entityId: category.id, eventId: category.eventId }),

  details(before, after) {
    return composeDetails({
      changedFields: changedKeysByAllowList(before, after, FIELD_ALLOWLIST),
    });
  },
};
