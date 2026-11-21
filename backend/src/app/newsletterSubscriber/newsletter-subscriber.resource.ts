import type { NewsletterSubscriber } from '#generated/prisma/client';
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
      status: this.data.confirmedAt ? 'confirmed' : 'pending',
      subscribedAt: this.data.subscribedAt.toISOString(),
      consentedAt: this.data.consentedAt.toISOString(),
      confirmedAt: this.data.confirmedAt?.toISOString() ?? null,
      confirmationSentAt: this.data.confirmationSentAt?.toISOString() ?? null,
    };
  }
}
