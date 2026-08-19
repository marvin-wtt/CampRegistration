import type { Identifiable } from './Identifiable.js';

export type OrganizationRole = 'ADMIN' | 'MEMBER';

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
