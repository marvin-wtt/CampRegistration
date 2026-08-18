import type { Identifiable } from './Identifiable.js';

/**
 * Organizations are moderated by system administrators. A PENDING organization
 * may already build camps, but only a VERIFIED one may publish them or open
 * registration — no participant data is ever collected on behalf of an
 * unmoderated legal entity.
 */
export type OrganizationVerificationStatus =
  'PENDING' | 'VERIFIED' | 'REJECTED';

export interface Organization extends Identifiable {
  name: string;
  verificationStatus: OrganizationVerificationStatus;

  contactEmail: string;
  phone: string | null;
  website: string | null;
  country: string;

  addressStreet: string;
  addressZipCode: string;
  addressCity: string;
  registrationNumber: string | null;

  verificationNote: string | null;
  /** The moderator's decision reason; null while never reviewed. */
  reviewNote: string | null;
  reviewedAt: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * A single organization, with what it owns. Every single-organization response
 * carries the counts, creation included; only the list responses leave them off
 * — they cost a query each, and the list view has no use for them. Mirrors the
 * `Camp` / `CampDetails` split.
 */
export interface OrganizationDetails extends Organization {
  ownedCamps: number;
  ownedNewsletters: number;
}

/**
 * Fields describing the legal entity that was actually vetted. Changing any of
 * them sends the organization back to PENDING for re-review.
 *
 * Contact details (email, phone, website) and the reviewer note are absent on
 * purpose: correcting a phone number should not pull a live camp out of the
 * public directory.
 *
 * Shared so the client can warn about exactly what the server acts on.
 */
export const ORGANIZATION_VERIFICATION_FIELDS = [
  'name',
  'country',
  'addressStreet',
  'addressZipCode',
  'addressCity',
  'registrationNumber',
] as const satisfies readonly (keyof OrganizationUpdateData)[];

export type OrganizationVerificationField =
  (typeof ORGANIZATION_VERIFICATION_FIELDS)[number];

/** Whether an update touches the vetted identity and so requires re-review. */
export function requiresReverification(
  current: Pick<Organization, OrganizationVerificationField>,
  data: OrganizationUpdateData,
): boolean {
  return ORGANIZATION_VERIFICATION_FIELDS.some(
    (field) => data[field] !== undefined && data[field] !== current[field],
  );
}

export interface OrganizationCreateData {
  name: string;
  contactEmail: string;
  phone?: string | null;
  website?: string | null;
  country: string;
  addressStreet: string;
  addressZipCode: string;
  addressCity: string;
  registrationNumber?: string | null;
  verificationNote?: string | null;
}

export type OrganizationUpdateData = Partial<OrganizationCreateData>;

/** The moderation decision. System administrators only. */
export interface OrganizationReviewData {
  status: Extract<OrganizationVerificationStatus, 'VERIFIED' | 'REJECTED'>;
  reviewNote?: string | null;
}

export interface OrganizationQuery {
  view?: 'all' | 'assigned';

  cursor?: string;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'submittedAt' | 'verificationStatus';
  sortType?: 'asc' | 'desc';
  name?: string;
  status?: OrganizationVerificationStatus;
}
