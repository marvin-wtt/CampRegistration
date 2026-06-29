import {
  changedKeysByAllowList,
  changedLeafPaths,
  composeChangedFields,
} from '#app/audit/audit.diff';
import type { AuditChangePolicy } from '#app/audit/audit.policy';
import type { Registration } from '#generated/prisma/client';

// Source-of-truth inputs only. Computed columns (firstName, country, …) are
// excluded — they are projections of `data` and would double-count an edit.
const FIELD_ALLOWLIST = ['status'] as const;

export const registrationAuditPolicy: AuditChangePolicy<Registration> = {
  entityType: 'registration',

  // `data` and `customData` are recorded by full leaf path (`data.allergies`,
  // `customData.foo`) so the trail shows exactly which answers changed — but
  // only the path, never the value.
  changedFields(before, after): string[] {
    return composeChangedFields(
      changedKeysByAllowList(before, after, FIELD_ALLOWLIST),
      changedLeafPaths(before?.data, after?.data, 'data'),
      changedLeafPaths(before?.customData, after?.customData, 'customData'),
    );
  },
};
