import { File, Registration } from "@prisma/client";
import groupBy from "../utils/groupBy";

const extractFiles = (registration: Registration): object => {
  if (!("files" in registration)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(
      groupBy(registration.files as File[], (i) => i.field ?? "files")
    ).map(([field, files]) => [field, files.map((file) => file.name).join(";")])
  );
};

const registrationResource = (registration: Registration) => {
  const data = typeof registration.data === "object" ? registration.data : {};

  const fileData = extractFiles(registration);
  const room = 'room' in registration ? registration.room : null;

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
