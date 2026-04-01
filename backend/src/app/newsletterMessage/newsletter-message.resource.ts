import type { NewsletterMessage, User } from '#generated/prisma/client';
import type { NewsletterMessage as NewsletterMessageData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

type NewsletterMessageWithSentBy = NewsletterMessage & {
  sentBy: Pick<User, 'id' | 'name'> | null;
};

export class NewsletterMessageResource extends JsonResource<
  NewsletterMessageWithSentBy,
  NewsletterMessageData
> {
  transform(): NewsletterMessageData {
    return {
      id: this.data.id,
      subject: this.data.subject,
      body: this.data.body,
      recipientCount: this.data.recipientCount,
      sentAt: this.data.sentAt.toISOString(),
      sentBy: this.data.sentBy
        ? { id: this.data.sentBy.id, name: this.data.sentBy.name }
        : null,
    };
  }
}
