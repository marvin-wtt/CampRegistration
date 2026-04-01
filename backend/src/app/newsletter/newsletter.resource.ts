import type { Newsletter } from '#generated/prisma/client';
import type { Newsletter as NewsletterData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export class NewsletterResource extends JsonResource<Newsletter, NewsletterData> {
  transform(): NewsletterData {
    return {
      id: this.data.id,
      name: this.data.name,
      description: this.data.description ?? null,
      createdAt: this.data.createdAt.toISOString(),
      updatedAt: this.data.updatedAt?.toISOString() ?? null,
    };
  }
}
