import type { Event } from '@camp-registration/common/entities';
import { zonedInstant } from '@camp-registration/common/utils';

export type EventPhase = 'ongoing' | 'upcoming' | 'recentlyEnded' | 'past';

const SIX_WEEKS_MS = 6 * 7 * 24 * 60 * 60 * 1000;

function isRegistrationOpen(event: Event): boolean {
  if (!event.registrationOpensAt && !event.registrationClosesAt) {
    return false;
  }
  const now = new Date();
  return (
    (!event.registrationOpensAt ||
      now >= new Date(event.registrationOpensAt)) &&
    (!event.registrationClosesAt || now <= new Date(event.registrationClosesAt))
  );
}

export function phaseOf(event: Event): EventPhase {
  const now = Date.now();
  const start = zonedInstant(event.startAt, event.timezone).getTime();
  const end = zonedInstant(event.endAt, event.timezone).getTime();
  if (now < start) {
    return 'upcoming';
  }
  if (now <= end) {
    return 'ongoing';
  }
  // Ended — fully past once registration is closed and it ended a while ago
  if (!isRegistrationOpen(event) && now - end > SIX_WEEKS_MS) {
    return 'past';
  }
  return 'recentlyEnded';
}

export function isEventPast(event: Event): boolean {
  return phaseOf(event) === 'past';
}
