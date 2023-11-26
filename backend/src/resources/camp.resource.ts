import { Camp } from "@prisma/client";

type CampWithFreePlaces = Camp & {
  freePlaces?: Record<string, number> | number;
};

const campResource = (camp: CampWithFreePlaces) => {
  return {
    id: camp.id,
    public: camp.public,
    active: camp.active,
    countries: camp.countries,
    name: camp.name,
    organization: camp.organization,
    contactEmail: camp.contactEmail,
    maxParticipants: camp.maxParticipants,
    minAge: camp.minAge,
    maxAge: camp.maxAge,
    startAt: camp.startAt,
    endAt: camp.endAt,
    price: camp.price ?? null,
    location: camp.location ?? null,
    freePlaces: camp.freePlaces,
  };
};

export const detailedCampResource = (camp: CampWithFreePlaces) => {
  return {
    ...campResource(camp),
    form: camp.form,
    themes: camp.themes,
  };
};

export default campResource;
