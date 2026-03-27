import type { NewsletterSubscriber } from '@prisma/client';
import type { NewsletterSubscriber as NewsletterSubscriberData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export class NewsletterSubscriberResource extends JsonResource<
  NewsletterSubscriber,
  NewsletterSubscriberData
> {
  transform(): NewsletterSubscriberData {
    return {
      id: this.data.id,
      email: this.data.email,
      name: this.data.name ?? null,
      country: this.data.country ?? null,
      subscribedAt: this.data.subscribedAt.toISOString(),
    };
  }
}
