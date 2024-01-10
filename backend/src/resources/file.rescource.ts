import { File } from '@prisma/client';
import type { ServiceFile as FileResource } from '@camp-registration/common/entities';

const fileResource = (file: File): FileResource => {
  return {
    id: file.id,
    name: file.originalName,
    field: file.field,
    type: file.type,
    size: file.size,
    accessLevel: file.accessLevel,
    createdAt: file.createdAt.toISOString(),
  };
};

export default fileResource;
