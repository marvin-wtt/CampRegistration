import type { EventRegistrationStatus } from '@camp-registration/common/entities';
import {
  allCountryValues,
  eventCountry,
  eventCountryFields,
  forCountry,
  translate,
} from '@camp-registration/common/utils';
import { localeForCountry } from '@camp-registration/common/locales';
import type { Event, Registration } from '#generated/prisma/client';

/**
 * The event's fields resolved for templates: text in the reader's `locale`,
 * per-country values for the registration's `country` — by the same rule the
 * form resolves them (`eventCountryFields`).
 */
export function translateEventContext(
  event: Event,
  { locale, country }: { locale: string; country: string | null },
) {
  const { organizer, contactEmail, maxParticipants } = eventCountryFields(
    event,
    country,
  );

  return {
    ...event,
    name: translate(event.name, locale) ?? '',
    location: translate(event.location, locale) ?? null,
    organizer,
    contactEmail,
    maxParticipants,
  };
}

/**
 * Who answers for a registration on the event's side: the contact of its
 * country (the one it selected, else the event's only one), addressed in that
 * country's language. Without a country — or one the event has no contact
 * for — every country's contact is addressed, in the registration's language.
 */
export function eventContactFor(
  event: Event,
  registration: Pick<Registration, 'country' | 'locale'>,
) {
  const country = eventCountry(event, registration.country);

  return {
    country,
    to:
      forCountry(event.contactEmail, country) ??
      allCountryValues(event.contactEmail),
    // The contact's own language is unknown; the contact of a country
    // presumably reads that country's.
    locale: country ? localeForCountry(country) : registration.locale,
  };
}

export function eventRegistrationStatus(event: Event): EventRegistrationStatus {
  const now = new Date();

  if (!event.registrationOpensAt && !event.registrationClosesAt) {
    return 'closed';
  }

  if (
    event.registrationClosesAt &&
    now >= new Date(event.registrationClosesAt)
  ) {
    return 'closed';
  }

  if (event.registrationOpensAt && now < new Date(event.registrationOpensAt)) {
    return 'upcoming';
  }

  return 'open';
}

export interface FreePlaces {
  freePlaces: number | Record<string, number>;
  freePlacesTotal: number;
}

/**
 * Free places per group, counted the way registration decides the waiting
 * list: every participant registration takes a place — accepted, pending and
 * waitlisted alike — so places freed while people wait stay theirs.
 *
 * Groups are independent, as registration checks each on its own: the total
 * is their sum, and an overbooked group never takes places from another.
 * Registrations outside every group are not counted.
 */
export function calculateFreePlaces(
  maxParticipants: number | Record<string, number>,
  registrations: { country: string | null }[],
): FreePlaces {
  if (typeof maxParticipants === 'number') {
    const free = Math.max(0, maxParticipants - registrations.length);

    return { freePlaces: free, freePlacesTotal: free };
  }

  const freePlaces: Record<string, number> = {};
  for (const [country, limit] of Object.entries(maxParticipants)) {
    const count = registrations.filter((r) => r.country === country).length;
    freePlaces[country] = Math.max(0, limit - count);
  }

  return {
    freePlaces,
    freePlacesTotal: Object.values(freePlaces).reduce((sum, v) => sum + v, 0),
  };
}
