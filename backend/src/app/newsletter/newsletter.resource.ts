import type { Newsletter } from '#generated/prisma/client';
import type { Newsletter as NewsletterData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

/**
 * A newsletter as every service query loads it: the record itself plus the
 * owning organization, whose name every listing shows next to it.
 */
export interface NewsletterWithOrganization extends Newsletter {
  organization: {
    id: string;
    name: string;
  };
}

export class NewsletterResource extends JsonResource<
  NewsletterWithOrganization,
  NewsletterData
> {
  transform(): NewsletterData {
    return {
      id: this.data.id,
      organizationId: this.data.organizationId,
      organizationName: this.data.organization.name,
      name: this.data.name,
      description: this.data.description ?? null,
      replyTo: this.data.replyTo ?? null,
      createdAt: this.data.createdAt.toISOString(),
      updatedAt: this.data.updatedAt?.toISOString() ?? null,
    };
  }
}
