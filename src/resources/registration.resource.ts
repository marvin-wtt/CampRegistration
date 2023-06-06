import { Registration } from "@prisma/client";

type RegistrationInput = Pick<
  Registration,
  "id" | "createdAt" | "updatedAt" | "data"
>;

const registrationResource = (registration: RegistrationInput) => {
  const data = typeof registration.data === "object" ? registration.data : {};

  // TODO How to get the room here?

  return {
    id: registration.id,
    ...data,
    room_id: null,
    room_name: null,
    updated_at: registration.updatedAt,
    created_at: registration.createdAt,
  };
};

export default registrationResource;
