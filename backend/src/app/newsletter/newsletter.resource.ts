import type { Newsletter as NewsletterData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import type { NewsletterWithOrganization } from '#app/newsletter/newsletter.types';

export class NewsletterResource extends JsonResource<
  NewsletterWithOrganization,
  NewsletterData
> {
  transform(): NewsletterData {
    return {
      id: this.data.id,
      organizationId: this.data.organizationId,
      organizationName: this.data.organization.name,
      organizationVerificationStatus: this.data.organization.verificationStatus,
      name: this.data.name,
      description: this.data.description ?? null,
      replyTo: this.data.replyTo ?? null,
      createdAt: this.data.createdAt.toISOString(),
      updatedAt: this.data.updatedAt?.toISOString() ?? null,
    };
  }
}
