import type { Event } from '#generated/prisma/client';
import type { OrganizationVerificationStatus } from '#generated/prisma/enums';

export interface EventWithFreePlaces extends Event {
  freePlaces: Record<string, number> | number;
  registrations: { country: string | null }[];
  organization: {
    id: string;
    name: string;
    verificationStatus: OrganizationVerificationStatus;
  };
}
