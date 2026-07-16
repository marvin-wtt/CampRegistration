import { SurveyJSCampData } from './SurveyJSCampData.js';
import { Identifiable } from './Identifiable.js';
import { ITheme } from 'survey-core';
import { Translatable } from './Translatable.js';

export interface Camp extends Identifiable {
  public: boolean;
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

export type CampCreateData = Omit<
  Partial<CampDetails> & Camp,
  'id' | 'freePlaces' | 'registrationStatus'
> & {
  referenceCampId?: string | undefined;
  preset?: 'standard' | 'minimal' | undefined | null;
};

export type CampUpdateData = Partial<CampCreateData>;

export type CampRegistrationStatus = 'open' | 'upcoming' | 'closed';

export interface CampQuery {
  cursor?: string;
  limit?: number;
  sortBy?: keyof Camp;
  sortType?: 'asc' | 'desc';

  name?: string;
  country?: string;
  age?: number;
  startAt?: string;
  endAt?: string;

  public?: boolean;
  status?: CampRegistrationStatus;

  view?: 'all' | 'assigned';
}
