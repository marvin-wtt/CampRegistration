import type { EventRegistrationStatus } from '@camp-registration/common/entities';
import {
  allGroupValues,
  eventGroup,
  eventGroupFields,
  forGroup,
  translate,
} from '@camp-registration/common/utils';
import { localeForCountry } from '@camp-registration/common/locales';
import type { Event, Registration } from '#generated/prisma/client';

/**
 * The event's fields resolved for templates: text in the reader's `locale`,
 * per-group values for the registration's `group` — by the same rule the form
 * resolves them (`eventGroupFields`).
 */
export function translateEventContext(
  event: Event,
  { locale, group }: { locale: string; group: string | null },
) {
  const { organizer, contactEmail, maxParticipants } = eventGroupFields(
    event,
    group,
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
 * group (the one it selected, else the event's only one), addressed in the
 * language of the group's country. Without a group — or one the event has no
 * contact for — every group's contact is addressed, in the registration's
 * language.
 */
export function eventContactFor(
  event: Event,
  registration: Pick<Registration, 'group' | 'locale'>,
) {
  const group = eventGroup(event, registration.group);

  return {
    group,
    to:
      forGroup(event.contactEmail, group) ?? allGroupValues(event.contactEmail),
    // The contact's own language is unknown; the contact of a group
    // presumably reads its country's.
    locale: group ? localeForCountry(group) : registration.locale,
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
  registrations: { group: string | null }[],
): FreePlaces {
  if (typeof maxParticipants === 'number') {
    const free = Math.max(0, maxParticipants - registrations.length);

    return { freePlaces: free, freePlacesTotal: free };
  }

  const freePlaces: Record<string, number> = {};
  for (const [group, limit] of Object.entries(maxParticipants)) {
    const count = registrations.filter((r) => r.group === group).length;
    freePlaces[group] = Math.max(0, limit - count);
  }

  return {
    freePlaces,
    freePlacesTotal: Object.values(freePlaces).reduce((sum, v) => sum + v, 0),
  };
}
