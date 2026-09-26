import type { Newsletter, Organization } from '#generated/prisma/client';

export interface NewsletterWithOrganization extends Newsletter {
  organization: Pick<Organization, 'id' | 'name' | 'verificationStatus'>;
}
