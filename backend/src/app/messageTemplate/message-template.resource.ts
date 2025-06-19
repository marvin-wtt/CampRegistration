import { JsonResource, ResourceCollection } from '#core/resource/JsonResource';
import type { MessageTemplate, File } from '#generated/prisma/client';
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

export type MessageTemplateDefault = Pick<
  MessageTemplate,
  'body' | 'subject'
> & {
  event: string;
};

export class MessageTemplateDefaultResource extends JsonResource<
  MessageTemplateDefault,
  MessageTemplateData
> {
  transform(): MessageTemplateData {
    return {
      id: null,
      event: this.data.event,
      subject: this.data.subject,
      body: this.data.body,
      priority: 'normal',
      replyTo: null,
      attachments: null,
      updatedAt: null,
      createdAt: null,
    };
  }
}

// Common resource as generic types somehow don't work with the collect method
export class MessageTemplateCollection extends ResourceCollection<
  MessageTemplate | MessageTemplateDefault,
  MessageTemplateData,
  MessageTemplateResource | MessageTemplateDefaultResource
> {}
