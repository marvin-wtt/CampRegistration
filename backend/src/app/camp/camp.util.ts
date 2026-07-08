import type { CampRegistrationStatus } from '@camp-registration/common/entities';
import type { Camp } from '#generated/prisma/client';

export function campRegistrationStatus(camp: Camp): CampRegistrationStatus {
  const now = new Date();

  if (!camp.registrationOpensAt && !camp.registrationClosesAt) {
    return 'closed';
  }

  if (camp.registrationClosesAt && now >= new Date(camp.registrationClosesAt)) {
    return 'closed';
  }

  if (camp.registrationOpensAt && now < new Date(camp.registrationOpensAt)) {
    return 'upcoming';
  }

  return 'open';
}
