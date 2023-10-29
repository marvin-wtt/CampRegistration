import { Camp } from "@prisma/client";

const campResource = (camp: Camp) => {
  return {
    id: camp.id,
    public: camp.public,
    active: camp.active,
    countries: camp.countries,
    name: camp.name,
    organization: camp.organization,
    maxParticipants: camp.maxParticipants,
    minAge: camp.minAge,
    maxAge: camp.maxAge,
    startAt: camp.startAt,
    endAt: camp.endAt,
    price: camp.price ?? null,
    location: camp.location ?? null,
  };
};

export const detailedCampResource = (camp: Camp) => {
  return {
    ...campResource(camp),
    form: camp.form,
    themes: camp.themes,
  };
};

export default campResource;
