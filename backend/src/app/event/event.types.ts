import type { Event, PriceModel } from '#generated/prisma/client';
import type { OrganizationVerificationStatus } from '#generated/prisma/enums';

// The shape `eventResourceInclude()` fetches, enriched with the computed
// `freePlaces` — what `EventResource` and registration validation see, not
// just a plain `Event` row.
export interface EventWithRelations extends Event {
  freePlaces: Record<string, number> | number;
  freePlacesTotal: number;
  registrations: { country: string | null }[];
  organization: {
    id: string;
    name: string;
    verificationStatus: OrganizationVerificationStatus;
  };
  priceModel: Pick<PriceModel, 'id' | 'name' | 'isDefault'> | null;
  // See `EVENT_LOGO_SLOT`/`EVENT_BANNER_SLOT` — whether a public, ready file
  // exists for each reserved slot. `EventResource` addresses it by slot, not
  // by id.
  hasLogo: boolean;
  hasBanner: boolean;
}
