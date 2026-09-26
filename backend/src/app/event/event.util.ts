import type { EventRegistrationStatus } from '@camp-registration/common/entities';
import type { Event } from '#generated/prisma/client';
import { translateObject } from '#utils/translateObject';

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
