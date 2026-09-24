import {
  changedKeysByAllowList,
  changedValues,
  composeChangeSet,
} from '#app/audit/audit.diff';
import type { AuditChangePolicy } from '#app/audit/audit.policy';
import type { EventManager, Invitation } from '#generated/prisma/client';
import type { AuditChangeSet } from '@camp-registration/common/entities';
import { maskEmail } from '#utils/maskEmail';

const FIELD_ALLOWLIST = ['role', 'expiresAt'] as const;

type AuditedManager = Pick<EventManager, 'userId' | 'role' | 'expiresAt'> & {
  invitation?: Pick<Invitation, 'email'> | null;
};

export const eventManagerAuditPolicy: AuditChangePolicy<AuditedManager> = {
  entityType: 'eventManager',

  changeSet(before, after) {
    const fields = changedKeysByAllowList(before, after, FIELD_ALLOWLIST);
    if (fields.length === 0) {
      return {};
    }
    return composeChangeSet({
      changedFields: fields,
      changedValues: changedValues(before, after, FIELD_ALLOWLIST),
      ...managerIdentity(after ?? before),
    });
  },
};

/**
 * `role` and the subject identify *what* access was given and *to whom*. The
 * subject is the user id (resolved to a name at read time) or, for a pending
 * invitation, a masked email.
 */
export function managerIdentity(
  manager: AuditedManager | null | undefined,
): AuditChangeSet {
  if (!manager) {
    return {};
  }
  return composeChangeSet({
    context: { role: manager.role },
    subjectId: manager.userId,
    subjectHint:
      !manager.userId && manager.invitation
        ? maskEmail(manager.invitation.email)
        : undefined,
  });
}

/** `managerIdentity` plus the initial values the access was granted with. */
export function managerGrant(manager: AuditedManager): AuditChangeSet {
  return composeChangeSet({
    ...managerIdentity(manager),
    changedValues: changedValues(null, manager, FIELD_ALLOWLIST),
  });
}
