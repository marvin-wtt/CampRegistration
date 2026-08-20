import type { Camp } from '#generated/prisma/client';
import type { OrganizationVerificationStatus } from '#generated/prisma/enums';

export interface CampWithFreePlaces extends Camp {
  freePlaces: Record<string, number> | number;
  registrations: { country: string | null }[];
  organization: {
    id: string;
    name: string;
    verificationStatus: OrganizationVerificationStatus;
  };
}
