import type { Camp } from '@camp-registration/common/entities';

export type CampPhase = 'ongoing' | 'upcoming' | 'recentlyEnded' | 'past';

const SIX_WEEKS_MS = 6 * 7 * 24 * 60 * 60 * 1000;

function isRegistrationOpen(camp: Camp): boolean {
  if (!camp.registrationOpensAt && !camp.registrationClosesAt) {
    return false;
  }
  const now = new Date();
  return (
    (!camp.registrationOpensAt || now >= new Date(camp.registrationOpensAt)) &&
    (!camp.registrationClosesAt || now <= new Date(camp.registrationClosesAt))
  );
}

export function phaseOf(camp: Camp): CampPhase {
  const now = Date.now();
  const start = new Date(camp.startAt).getTime();
  const end = new Date(camp.endAt).getTime();
  if (now < start) {
    return 'upcoming';
  }
  if (now <= end) {
    return 'ongoing';
  }
  // Ended — fully past once registration is closed and it ended a while ago
  if (!isRegistrationOpen(camp) && now - end > SIX_WEEKS_MS) {
    return 'past';
  }
  return 'recentlyEnded';
}

export function isCampPast(camp: Camp): boolean {
  return phaseOf(camp) === 'past';
}
