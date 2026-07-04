import {
  changedKeysByAllowList,
  composeChangeSet,
} from '#app/audit/audit.diff';
import type { AuditChangePolicy } from '#app/audit/audit.policy';
import type { CampManager } from '#generated/prisma/client';

const FIELD_ALLOWLIST = ['role', 'expiresAt'] as const;

export const campManagerAuditPolicy: AuditChangePolicy<CampManager> = {
  entityType: 'campManager',

  changeSet(before, after) {
    return composeChangeSet(
      changedKeysByAllowList(before, after, FIELD_ALLOWLIST),
      managerIdentity(after ?? before),
    );
  },
};

/**
 * `userId`/`role` identify *who* the entry is about and *what* access they
 * were given — without them an entry only says "a manager changed", not who
 * or to what. Always attached (not just on change) so create/update/delete
 * entries are all identifiable; `userId` is resolved to a name at read time
 * ({@link AuditService.resolveActors}), the same way `actorId` is — never
 * stored as a name here.
 */
export function managerIdentity(
  manager: Pick<CampManager, 'userId' | 'role'> | null | undefined,
): Record<string, string | null> {
  if (!manager) {
    return {};
  }
  return { userId: manager.userId, role: manager.role };
}
