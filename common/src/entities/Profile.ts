import type { OrganizationPermission, Permissions } from '#permissions';
import type { OrganizationRole } from './OrganizationMember.js';
import type { OrganizationVerificationStatus } from './Organization.js';

interface CampAccess {
  campId: string;
  /**
   * The camp-manager role, or the sentinel `'ORGANIZATION'` when the access is
   * derived purely from an organization OWNER/ADMIN membership.
   */
  role: string;
  permissions: Permissions;
}

interface OrganizationAccess {
  organizationId: string;
  role: OrganizationRole;
  permissions: OrganizationPermission[];
  /**
   * Carried so the UI can distinguish "you may create a camp here" from "this
   * organization is still awaiting moderation" without a second request.
   */
  verificationStatus: OrganizationVerificationStatus;
}

export interface Profile {
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  twoFactorEnabled: boolean;
  locale: string;
  campAccess: CampAccess[];
  organizationAccess: OrganizationAccess[];
}

export type ProfileUpdateData = Partial<Omit<Profile, 'role'>> & {
  password?: string;
  currentPassword?: string;
};
