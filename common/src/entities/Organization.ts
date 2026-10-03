import type { Identifiable } from './Identifiable.js';
import type { PriceModelSummary } from './Billing.js';

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
  vatNumber: string | null;
  priceModelId: string;

  verificationNote: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string | null;
}

/** The administrators' listing (`view=all`). */
export interface AdminOrganization extends Organization {
  priceModel: PriceModelSummary;
}

export interface OrganizationDetails extends Organization {
  ownedEvents: number;
  ownedNewsletters: number;
  /** Running or open bills; they block deletion until paid. */
  unpaidBills: number;
}

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
  vatNumber?: string | null;
  verificationNote?: string | null;
}

export type OrganizationUpdateData = Partial<OrganizationCreateData>;

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
