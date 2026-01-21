import { JsonResource } from '#core/resource/JsonResource';
import type { MessageTemplate, File } from '@prisma/client';
import type { MessageTemplate as MessageTemplateData } from '@camp-registration/common/entities';
import { FileResource } from '#app/file/file.resource';

export interface MessageTemplateWithFiles extends MessageTemplate {
  attachments: File[];
}

export class MessageTemplateResource extends JsonResource<
  MessageTemplateWithFiles,
  MessageTemplateData
> {
  transform(): MessageTemplateData {
    return {
      id: this.data.id,
      country: this.data.country ?? null,
      event: this.data.event ?? null,
      subject: this.data.subject,
      body: this.data.body,
      priority: this.data.priority,
      replyTo: this.data.replyTo ?? null,
      attachments: FileResource.collection(this.data.attachments).transform(),
      updatedAt: this.data.updatedAt?.toISOString() ?? null,
      createdAt: this.data.createdAt.toISOString(),
    };
  }
}
