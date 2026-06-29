import {
  changedKeysByAllowList,
  composeChangeSet,
} from '#app/audit/audit.diff';
import type { AuditChangePolicy } from '#app/audit/audit.policy';

const FIELD_ALLOWLIST = ['role', 'expiresAt'] as const;

export const campManagerAuditPolicy: AuditChangePolicy = {
  entityType: 'campManager',

  changeSet(before, after) {
    return composeChangeSet(
      changedKeysByAllowList(before, after, FIELD_ALLOWLIST),
    );
  },
};
