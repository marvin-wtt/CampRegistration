import type { PermissionScope } from '#permissions';
import type { Identifiable } from './Identifiable.js';

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
  otp: string;
}

/** How long a grant lasts. */
export const ADMIN_ACCESS_GRANT_MINUTES = 60;
