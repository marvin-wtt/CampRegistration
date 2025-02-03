import { JsonResource } from '#core/resource/JsonResource';
import type { MessageTemplate } from '@prisma/client';
import type { MessageTemplate as MessageTemplateData } from '@camp-registration/common/entities';

export class MessageTemplateResource extends JsonResource<
  MessageTemplate,
  MessageTemplateData
> {
  transform() {
    return {
      id: this.data.id,
      name: this.data.name,
      subject: this.data.subject,
      body: this.data.body,
      priority: this.data.priority,
      attachments: null, // TODO
    };
  }
}
