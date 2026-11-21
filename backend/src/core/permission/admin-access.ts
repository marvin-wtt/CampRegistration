import type { Request } from 'express';
import type { PermissionScope } from '@camp-registration/common/permissions';
import prisma from '#core/database/database.client';

export interface ActiveAdminAccess {
  id: string;
  expiresAt: Date;
}

// Several guards on one request ask about the same subject.
const cache = new WeakMap<
  Request,
  Map<string, Promise<ActiveAdminAccess | null>>
>();

export function findActiveAdminAccess(
  userId: string,
  scope: PermissionScope,
  scopeId: string,
): Promise<ActiveAdminAccess | null> {
  return prisma.adminAccessGrant.findFirst({
    where: {
      userId,
      scope,
      scopeId,
      endedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, expiresAt: true },
    orderBy: { expiresAt: 'desc' },
  });
}

/** The requesting administrator's active grant on the subject, if any. */
export function activeAdminAccess(
  req: Request,
  scope: PermissionScope,
  scopeId: string,
): Promise<ActiveAdminAccess | null> {
  let entries = cache.get(req);
  if (!entries) {
    entries = new Map();
    cache.set(req, entries);
  }

  const key = `${scope}:${scopeId}`;
  let entry = entries.get(key);
  if (!entry) {
    entry = findActiveAdminAccess(req.authUserId(), scope, scopeId);
    entries.set(key, entry);
  }

  return entry;
}
