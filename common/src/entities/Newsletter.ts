import type { Identifiable } from './Identifiable.js';
import type { OrganizationVerificationStatus } from './Organization.js';

export interface Newsletter extends Identifiable {
  /** The organization that owns the newsletter. */
  organizationId: string;
  /** The owning organization's name, for display next to the newsletter. */
  organizationName: string;
  /**
   * The owning organization's moderation status. Anything other than
   * `VERIFIED` means the newsletter can be set up — subscribers, managers,
   * drafts — but refuses to send, so management surfaces must say so rather
   * than let the send button look available.
   */
  organizationVerificationStatus: OrganizationVerificationStatus;
  name: string;
  description: string | null;
  replyTo: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface NewsletterCreateData {
  organizationId: string;
  name: string;
  description?: string | null;
  replyTo?: string | null;
}

export interface NewsletterUpdateData {
  name?: string;
  description?: string | null;
  replyTo?: string | null;
}

export interface NewsletterQuery {
  view?: 'all' | 'assigned';

  cursor?: string;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortType?: 'asc' | 'desc';
  name?: string;
  organizationId?: string;
}
