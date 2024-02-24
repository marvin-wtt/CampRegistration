import { Camp } from '@prisma/client';
import type {
  Camp as CampResource,
  CampDetails as CampDetailsResource,
} from '@camp-registration/common/entities';

type CampWithFreePlaces = Camp & {
  freePlaces?: Record<string, number> | number;
};

const campResource = (camp: CampWithFreePlaces): CampResource => {
  return {
    id: camp.id,
    public: camp.public,
    active: camp.active,
    countries: camp.countries,
    name: camp.name,
    organizer: camp.organizer,
    contactEmail: camp.contactEmail,
    maxParticipants: camp.maxParticipants,
    minAge: camp.minAge,
    maxAge: camp.maxAge,
    startAt: camp.startAt.toISOString(),
    endAt: camp.endAt.toISOString(),
    price: camp.price ?? null,
    location: camp.location ?? null,
    freePlaces: camp.freePlaces ?? null,
  };
};

export const detailedCampResource = (
  camp: CampWithFreePlaces,
): CampDetailsResource => {
  return {
    ...campResource(camp),
    form: camp.form,
    themes: camp.themes,
  };
};

export default campResource;
