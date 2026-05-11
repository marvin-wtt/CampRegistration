import type { NewsletterManager, User } from '#generated/prisma/client';
import type { NewsletterManager as NewsletterManagerData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export interface NewsletterManagerWithUser extends NewsletterManager {
  user: User;
}

export class NewsletterManagerResource extends JsonResource<
  NewsletterManagerWithUser,
  NewsletterManagerData
> {
  transform(): NewsletterManagerData {
    return {
      id: this.data.id,
      name: this.data.user.name,
      email: this.data.user.email,
    };
  }
}
