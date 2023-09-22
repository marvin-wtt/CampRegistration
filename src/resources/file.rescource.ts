import { File } from "@prisma/client";

const fileResource = (file: File) => {
  return {
    id: file.id,
    name: file.name,
    field: file.field,
    type: file.type,
    size: file.size,
    accessLevel: file.accessLevel,
    createdAt: file.createdAt,
  };
};

export default fileResource;
