import { SurveyJSCampData } from './SurveyJSCampData.js';
import { Identifiable } from './Identifiable.js';
import { ITheme } from 'survey-core';
import { Translatable } from './Translatable.js';
import type { OrganizationVerificationStatus } from './Organization.js';

export interface Camp extends Identifiable {
  organizationId: string;
  organizationName: string;
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
  registrationStatus: CampRegistrationStatus;
}

export interface CampDetails extends Camp {
  form: SurveyJSCampData;
  themes: Record<string, ITheme>;
}

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

export type CampUpdateData = Omit<
  Partial<CampCreateData>,
  'organizationId' | 'countries'
>;

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
  country?: string | string[];
  age?: number;
  startAt?: string;
  endAt?: string;

  listed?: boolean;
  status?: CampRegistrationStatus;
  organizationId?: string;

  view?: 'all' | 'assigned';
}
