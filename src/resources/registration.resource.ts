import { File, Registration, Room, Bed } from "@prisma/client";
import groupBy from "../utils/groupBy";

interface RegistrationWithBedAndFiles extends Registration {
  bed?: BedWithRoom | null;
  files?: File[] | null;
}

interface BedWithRoom extends Bed {
  room: Room;
}

const extractFiles = (registration: RegistrationWithBedAndFiles): object => {
  if (!registration.files) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(
      groupBy(registration.files, (i) => i.field ?? "files")
    ).map(([field, files]) => [field, files.map((file) => file.name).join(";")])
  );
};


const registrationResource = (registration: RegistrationWithBedAndFiles) => {
  const data = typeof registration.data === "object" ? registration.data : {};

  const fileData = extractFiles(registration);
  const room = registration.bed ? {
    id: registration.bed.room.id,
    name: registration.bed.room.name,
    bed: registration.bed.bedNumber,
  } : null;

  return {
    ...data,
    ...fileData,
    id: registration.id,
    room,
    updated_at: registration.updatedAt,
    created_at: registration.createdAt,
  };
};

export default registrationResource;
