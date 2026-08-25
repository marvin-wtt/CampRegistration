import { SurveyJSEventData } from './SurveyJSEventData.js';
import { Identifiable } from './Identifiable.js';
import { ITheme } from 'survey-core';
import { Translatable } from './Translatable.js';
import type { OrganizationVerificationStatus } from './Organization.js';

export interface Event extends Identifiable {
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
  registrationStatus: EventRegistrationStatus;
}

export interface EventDetails extends Event {
  form: SurveyJSEventData;
  themes: Record<string, ITheme>;
}

export type EventCreateData = Omit<
  Partial<EventDetails> & Event,
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
  referenceEventId?: string | undefined;
  preset?: 'camp' | 'seminar' | undefined | null;
};

export type EventUpdateData = Omit<
  Partial<EventCreateData>,
  'organizationId' | 'countries'
>;

export interface EventOrganizationUpdateData {
  organizationId: string;
}

export type EventRegistrationStatus = 'open' | 'upcoming' | 'closed';

export interface EventQuery {
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
  status?: EventRegistrationStatus;
  organizationId?: string;

  view?: 'all' | 'assigned';
}
