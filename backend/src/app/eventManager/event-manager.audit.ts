import {
  changedKeysByAllowList,
  composeChangeSet,
} from '#app/audit/audit.diff';
import type { AuditChangePolicy } from '#app/audit/audit.policy';
import type { EventManager } from '#generated/prisma/client';
import type { AuditChangeSet } from '@camp-registration/common/entities';

const FIELD_ALLOWLIST = ['role', 'expiresAt'] as const;

export const eventManagerAuditPolicy: AuditChangePolicy<EventManager> = {
  entityType: 'eventManager',

  changeSet(before, after) {
    const fields = changedKeysByAllowList(before, after, FIELD_ALLOWLIST);
    const identity = managerIdentity(after ?? before);
    return {
      ...(fields.length > 0 ? { changedFields: fields } : {}),
      ...identity,
    };
  },
};

/**
 * `role` (as a value) and `subjectId` identify *what* access the entry's
 * manager was given and *who* they are — without them an entry only says "a
 * manager changed", not to what or for whom. Always attached (not just on
 * change) so create/update/delete entries are all identifiable on their own.
 * `subjectId` is resolved to a name at read time
 * ({@link AuditService.resolveActors}), the same way `actorId` is — never
 * stored as a name here. A pending invitation has no `userId` yet, so
 * `subjectId` is omitted until it's accepted.
 */
export function managerIdentity(
  manager: Pick<EventManager, 'userId' | 'role'> | null | undefined,
): AuditChangeSet {
  return composeChangeSet(
    [],
    manager ? { role: manager.role } : {},
    manager?.userId,
  );
}
