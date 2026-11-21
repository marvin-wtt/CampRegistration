import type { Event } from '@camp-registration/common/entities';
import { zonedInstant } from '@camp-registration/common/utils';

export type EventPhase = 'ongoing' | 'upcoming' | 'ended';

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
  return 'ended';
}

export function isEventArchived(event: Event): boolean {
  return event.archivedAt !== null;
}
