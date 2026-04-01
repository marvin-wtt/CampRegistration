import type { NewsletterMessage } from '#generated/prisma/client';
import type { NewsletterMessage as NewsletterMessageData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export class NewsletterMessageResource extends JsonResource<
  NewsletterMessage,
  NewsletterMessageData
> {
  transform(): NewsletterMessageData {
    return {
      id: this.data.id,
      subject: this.data.subject,
      body: this.data.body,
      recipientCount: this.data.recipientCount,
      sentAt: this.data.sentAt.toISOString(),
    };
  }
}
