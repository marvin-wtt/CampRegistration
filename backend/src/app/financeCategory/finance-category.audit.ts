import { changedKeysByAllowList, composeDetails } from '#app/audit/audit.diff';
import type { AuditChangePolicy } from '#app/audit/audit.policy';
import type { FinanceCategory } from '#generated/prisma/client';

const FIELD_ALLOWLIST: (keyof FinanceCategory)[] = [
  'name',
  'parentId',
  'position',
  'archivedAt',
];

export const financeCategoryAuditPolicy: AuditChangePolicy<FinanceCategory> = {
  entityType: 'financeCategory',

  locate: (category) => ({ entityId: category.id, eventId: category.eventId }),

  details(before, after) {
    return composeDetails({
      changedFields: changedKeysByAllowList(before, after, FIELD_ALLOWLIST),
    });
  },
};
