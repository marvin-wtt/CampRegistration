import type {
  EventScopedPermission,
  NewsletterPermission,
  OrganizationPermission,
} from '#permissions';
import type { OrganizationRole } from './OrganizationMember.js';
import type { OrganizationVerificationStatus } from './Organization.js';

interface EventAccess {
  eventId: string;
  /**
   * The event-manager role, or the sentinel `'ORGANIZATION'` when the access is
   * derived purely from an organization OWNER/ADMIN membership.
   */
  role: string;
  permissions: EventScopedPermission[];
  /**
   * The user's own `EventManager` id, so a client can recognise records assigned
   * to them (tasks, for one) without loading the roster. `null` when the access
   * is organization-derived and no manager record exists.
   */
  managerId: string | null;
}

interface NewsletterAccess {
  newsletterId: string;
  /**
   * The newsletter-manager role, or the sentinel `'ORGANIZATION'` when the
   * access is derived purely from an organization ADMIN membership.
   */
  role: string;
  permissions: NewsletterPermission[];
}

interface OrganizationAccess {
  organizationId: string;
  role: OrganizationRole;
  permissions: OrganizationPermission[];
  /**
   * Carried so the UI can distinguish "you may create an event here" from "this
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
  eventAccess: EventAccess[];
  newsletterAccess: NewsletterAccess[];
  organizationAccess: OrganizationAccess[];
}

export type ProfileUpdateData = Partial<Omit<Profile, 'role'>> & {
  password?: string;
  currentPassword?: string;
};
