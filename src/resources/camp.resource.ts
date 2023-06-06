import { Camp } from "@prisma/client";

const campResource = (camp: Camp) => {
  return {
    id: camp.id,
    public: camp.public,
    countries: camp.countries,
    name: camp.name,
    max_participants: camp.maxParticipants,
    min_age: camp.minAge,
    max_age: camp.maxAge,
    start_at: camp.startAt,
    end_at: camp.endAt,
    price: camp.price,
    location: camp.location,
  };
};

export const detailedCampResource = (camp: Camp) => {
  return {
    ...campResource(camp),
    form: camp.form,
  };
};

export default campResource;
