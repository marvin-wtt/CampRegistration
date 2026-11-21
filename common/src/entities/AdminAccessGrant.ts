import type { PermissionScope } from '#permissions';
import type { Identifiable } from './Identifiable.js';
import type { Translatable } from './Translatable.js';

/**
 * Temporary access of a system administrator to an event, newsletter or
 * organization beyond their own role.
 */
export interface AdminAccessGrant extends Identifiable {
  scope: PermissionScope;
  scopeId: string;
  reason: string;
  expiresAt: string;
  endedAt: string | null;
  createdAt: string;
}

export interface AdminAccessGrantCreateData {
  scope: PermissionScope;
  scopeId: string;
  reason: string;
}

/** How long a grant lasts. */
export const ADMIN_ACCESS_GRANT_MINUTES = 60;

/** A grant as the administration review page lists it. */
export interface AdminAccessGrantReview extends AdminAccessGrant {
  user: { id: string; name: string; email: string };
  // `null` once the resource is deleted.
  subjectName: Translatable | null;
}

export interface AdminAccessGrantQuery {
  cursor?: string;
  limit?: number;
  scope?: PermissionScope;
  userId?: string;
  active?: boolean;
  search?: string;
}
