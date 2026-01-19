import type { Message, File } from '@prisma/client';
import type { Message as MessageData } from '@camp-registration/common/entities';
import { FileResource } from '#app/file/file.resource';
import { JsonResource } from '#core/resource/JsonResource';

export interface MessageWithFiles extends Message {
  attachments: File[];
}

export class MessageResource extends JsonResource<
  MessageWithFiles,
  MessageData
> {
  transform(): MessageData {
    return {
      id: this.data.id,
      to: this.data.to ?? null,
      cc: this.data.cc ?? null,
      bcc: this.data.bcc ?? null,
      replyTo: this.data.replyTo,
      subject: this.data.subject,
      body: this.data.body,
      priority: this.data.priority,
      createdAt: this.data.createdAt.toISOString(),
      attachments: FileResource.collection(this.data.attachments).transform(),
    };
  }
}
