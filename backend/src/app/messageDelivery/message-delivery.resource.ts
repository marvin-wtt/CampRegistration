import { JsonResource } from '#core/resource/JsonResource';
import type { MessageDelivery as MessageDeliveryData } from '@camp-registration/common/entities';
import { FileResource } from '#app/file/file.resource';
import type { MessageDelivery, File } from '#generated/prisma/client.js';

export interface MessageDeliveryWithFiles extends MessageDelivery {
  attachments: File[];
}

export class MessageDeliveryResource extends JsonResource<
  MessageDeliveryWithFiles,
  MessageDeliveryData
> {
  transform(): MessageDeliveryData {
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
