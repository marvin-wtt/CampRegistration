import type { EventRegistrationStatus } from '@camp-registration/common/entities';
import type { Event } from '#generated/prisma/client';
import { translateObject } from '#utils/translateObject';
import {
  utcCarrierToNaiveDateTime,
  zonedInstant,
} from '@camp-registration/common/utils';

/**
 * The real instant of an event date. `startAt`/`endAt` hold the organizer's
 * wall-clock digits in a UTC-typed column, so they must never be compared with
 * `new Date()` directly.
 */
export function eventInstant(carrier: Date, timezone: string): Date {
  return zonedInstant(utcCarrierToNaiveDateTime(carrier), timezone);
}

/** The event's translatable fields resolved to one locale, for templates. */
export function translateEventContext(event: Event, locale: string) {
  return {
    ...event,
    name: translateObject(event.name, locale),
    organizer: translateObject(event.organizer, locale),
    contactEmail: translateObject(event.contactEmail, locale),
    maxParticipants: translateObject(event.maxParticipants, locale),
    location: translateObject(event.location, locale),
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
