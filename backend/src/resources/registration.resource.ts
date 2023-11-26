import { File, Registration, Room, Bed } from "@prisma/client";
import groupBy from "@/utils/groupBy";
import config from "@/config";

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

  const fileUrl = `${config.origin}/registrations/${registration.id}/files/`;
  return Object.fromEntries(
    Object.entries(groupBy(registration.files, (i) => i.field ?? "files")).map(
      ([field, files]) => [
        field,
        files.map((file) => fileUrl + file.id).join(";"),
      ],
    ),
  );
};

const registrationResource = (registration: RegistrationWithBedAndFiles) => {
  const files = extractFiles(registration);
  const room = registration.bed ? registration.bed.room.name : null;

  return {
    id: registration.id,
    waitingList: registration.waitingList,
    data: registration.data,
    campData: registration.campData,
    files,
    room,
    // Use snake case because form keys should be snake case too
    updated_at: registration.updatedAt,
    created_at: registration.createdAt,
  };
};

export default registrationResource;
