import type { Event } from '#generated/prisma/client';
import type { OrganizationVerificationStatus } from '#generated/prisma/enums';

// The shape `eventResourceInclude()` fetches, enriched with the computed
// `freePlaces` — what `EventResource` and registration validation see, not
// just a plain `Event` row.
export interface EventWithRelations extends Event {
  freePlaces: Record<string, number> | number;
  registrations: { country: string | null }[];
  organization: {
    id: string;
    name: string;
    verificationStatus: OrganizationVerificationStatus;
  };
  // See `EVENT_LOGO_SLOT` — whether a public, ready logo file exists.
  // `EventResource` addresses it by slot, not by id.
  hasLogo: boolean;
}
