import {
  composeChangeSet,
  diffByAllowList,
  pickSnapshot,
} from '#app/audit/audit.diff';
import type {
  AuditChangePolicy,
  AuditSnapshotPolicy,
} from '#app/audit/audit.policy';

const FIELD_ALLOWLIST = ['role', 'expiresAt'] as const;
const SNAPSHOT_KEYS = ['role', 'userId', 'expiresAt'] as const;

export const campManagerAuditPolicy: AuditChangePolicy & AuditSnapshotPolicy = {
  entityType: 'campManager',

  changeSet(before, after) {
    return composeChangeSet(diffByAllowList(before, after, FIELD_ALLOWLIST));
  },

  snapshot(entity) {
    const base = pickSnapshot(entity, SNAPSHOT_KEYS);
    // Invitations carry the email of a not-yet-registered user (distinguishes
    // an invite from adding an existing user). Present only when loaded.
    const email = (entity as { invitation?: { email?: string } | null })
      .invitation?.email;
    if (email) {
      base.email = email;
    }
    return base;
  },
};
