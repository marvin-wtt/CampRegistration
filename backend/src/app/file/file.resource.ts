import type { File } from '#/generated/prisma/client.js';
import type { ServiceFile as FileResourceData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import config from '#config/index';

export class FileResource extends JsonResource<File, FileResourceData> {
  transform(): FileResourceData {
    return {
      id: this.data.id,
      name: this.data.originalName,
      field: this.data.field,
      type: this.data.type,
      size: this.data.size,
      accessLevel: this.data.accessLevel,
      createdAt: this.data.createdAt.toISOString(),
      url: `${config.origin}/api/v1/files/${this.data.id}`,
    };
  }
}
