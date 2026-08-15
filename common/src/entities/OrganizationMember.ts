import type { Identifiable } from './Identifiable.js';

/**
 * ADMIN manages the organization, its members, its camps and its newsletters.
 * MEMBER may create camps under it and nothing else.
 *
 * Distinct from the *system* role `User.role`, which is resolved through a
 * separate registry — an organization ADMIN has no system privileges.
 */
export type OrganizationRole = 'ADMIN' | 'MEMBER';

/** `PENDING` while an invited person has not registered an account yet. */
export type OrganizationMemberStatus = 'ACCEPTED' | 'PENDING';

export interface OrganizationMember extends Identifiable {
  name: string | null;
  email: string;
  role: OrganizationRole;
  status: OrganizationMemberStatus;
  createdAt: string;
}

export interface OrganizationMemberCreateData {
  email: string;
  role: OrganizationRole;
}

export interface OrganizationMemberUpdateData {
  role: OrganizationRole;
}
