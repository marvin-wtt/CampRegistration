import {
  composeChangeSet,
  diffByAllowList,
  diffLeaves,
  pickSnapshot,
} from '#app/audit/audit.diff';
import type {
  AuditChangePolicy,
  AuditSnapshotPolicy,
} from '#app/audit/audit.policy';
import type { AuditChangeSet } from '@camp-registration/common/entities';
import type { Registration } from '#generated/prisma/client';

// Source-of-truth inputs only. Computed columns (firstName, country, …) are
// excluded — they are projections of `data` and would double-count an edit.
const FIELD_ALLOWLIST = ['status', 'customData'] as const;

// Frozen into the audit entry on delete (computed name columns included purely
// for a readable "what was removed").
const SNAPSHOT_KEYS = [
  'firstName',
  'lastName',
  'status',
  'locale',
  'data',
  'customData',
] as const;

export const registrationAuditPolicy: AuditChangePolicy<Registration> &
  AuditSnapshotPolicy<Registration> = {
  entityType: 'registration',

  changeSet(before, after): AuditChangeSet {
    return composeChangeSet(
      diffByAllowList(before, after, FIELD_ALLOWLIST),
      diffLeaves(before?.data, after?.data),
    );
  },

  snapshot(entity) {
    return pickSnapshot(entity, SNAPSHOT_KEYS);
  },
};

/** Change set for the create event — records the initial status. */
export function registrationInitialChange(status: string): AuditChangeSet {
  return { fields: { status: { from: null, to: status } } };
}
