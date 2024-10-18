import { File } from '@prisma/client';
import type { ServiceFile } from '@camp-registration/common/entities';
import config from 'config';

export const fileResource = (file: File): ServiceFile => {
  return {
    id: file.id,
    name: file.originalName,
    field: file.field ?? null,
    type: file.type,
    size: file.size,
    accessLevel: file.accessLevel ?? null,
    createdAt: file.createdAt.toISOString(),
    url: `${config.origin}/files/${file.id}`,
  };
};

export default fileResource;
