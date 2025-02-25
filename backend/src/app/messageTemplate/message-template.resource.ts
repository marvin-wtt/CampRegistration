import { JsonResource } from '#core/resource/JsonResource';
import type { MessageTemplate } from '@prisma/client';
import type { MessageTemplate as MessageTemplateData } from '@camp-registration/common/entities';

export class MessageTemplateResource extends JsonResource<
  MessageTemplate,
  MessageTemplateData
> {
  transform(): MessageTemplateData {
    return {
      id: this.data.id ?? null,
      event: this.data.event ?? null,
      subject: this.data.subject,
      body: this.data.body,
      priority: this.data.priority ?? 'normal',
      replyTo: this.data.replyTo ?? null,
      attachments: null, // TODO
      updatedAt: this.data.updatedAt?.toISOString() ?? null,
      createdAt: this.data.createdAt?.toISOString() ?? null,
    };
  }
}
