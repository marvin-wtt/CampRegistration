import type { Message, File } from '@prisma/client';
import type { Message as MessageResourceData } from '@camp-registration/common/entities';
import { FileResource } from '#app/file/file.resource';
import { JsonResource } from '#core/resource/JsonResource';

interface MessageWithRelations extends Message {
  attachments: {
    file: File;
  }[];
}

export class MessageResource extends JsonResource<
  MessageWithRelations,
  MessageResourceData
> {
  transform() {
    return {
      id: this.data.id,
      replyTo: this.data.replyTo,
      subject: this.data.subject,
      body: this.data.body,
      priority: this.data.priority,
      createdAt: this.data.createdAt.toISOString(),
      attachments: FileResource.collection(
        this.data.attachments.map((v) => v.file),
      ).transform(),
    };
  }
}
