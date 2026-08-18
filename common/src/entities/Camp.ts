import { SurveyJSCampData } from './SurveyJSCampData.js';
import { Identifiable } from './Identifiable.js';
import { ITheme } from 'survey-core';
import { Translatable } from './Translatable.js';
import type { OrganizationVerificationStatus } from './Organization.js';

export interface Camp extends Identifiable {
  organizationId: string;
  /** The owning organization's name, for display next to the camp. */
  organizationName: string;
  /**
   * The owning organization's moderation status. Anything other than
   * `VERIFIED` means the camp is absent from the public directory and refuses
   * registrations regardless of its own `listed` flag and registration window —
   * so management surfaces must say so rather than let it look live.
   *
   * The full status rather than a boolean, because "awaiting review" and
   * "rejected" need different wording. Safe to carry: a camp whose organization
   * is unverified is only readable by its own managers, so the status never
   * reaches the public.
   */
  organizationVerificationStatus: OrganizationVerificationStatus;
  listed: boolean;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  confirmationMode: 'AUTOMATIC' | 'MANUAL';
  countries: string[];
  locales: string[];
  name: Translatable;
  organizer: Translatable;
  contactEmail: Translatable;
  maxParticipants: Translatable<number>;
  startAt: string;
  endAt: string;
  minAge: number;
  maxAge: number;
  location: Translatable | null;
  price: number;
  freePlaces: Translatable<number> | null;
  /** Derived from the registration window. */
  registrationStatus: CampRegistrationStatus;
}

export interface CampDetails extends Camp {
  form: SurveyJSCampData;
  themes: Record<string, ITheme>;
}

/** `locales` is derived from `countries` server-side. */
export type CampCreateData = Omit<
  Partial<CampDetails> & Camp,
  | 'id'
  | 'freePlaces'
  | 'registrationStatus'
  | 'organizationName'
  | 'organizationVerificationStatus'
  | 'locales'
  | 'registrationOpensAt'
  | 'registrationClosesAt'
> & {
  registrationOpensAt?: string | null | undefined;
  registrationClosesAt?: string | null | undefined;
  referenceCampId?: string | undefined;
  preset?: 'standard' | 'minimal' | undefined | null;
};

/** Moving a camp between organizations is a system-administrator action. */
export type CampUpdateData = Omit<Partial<CampCreateData>, 'organizationId'>;

export interface CampOrganizationUpdateData {
  organizationId: string;
}

export type CampRegistrationStatus = 'open' | 'upcoming' | 'closed';

export interface CampQuery {
  cursor?: string;
  limit?: number;
  sortBy?: string;
  sortType?: 'asc' | 'desc';

  name?: string;
  country?: string;
  age?: number;
  startAt?: string;
  endAt?: string;

  listed?: boolean;
  status?: CampRegistrationStatus;
  organizationId?: string;

  view?: 'all' | 'assigned';
}
