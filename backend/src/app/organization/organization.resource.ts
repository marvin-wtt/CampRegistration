import type { Organization } from '#generated/prisma/client.js';
import type {
  Organization as OrganizationData,
  OrganizationDetails as OrganizationDetailsData,
} from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export interface OrganizationWithCounts extends Organization {
  ownedCamps: number;
  ownedNewsletters: number;
}

export class OrganizationResource extends JsonResource<
  Organization,
  OrganizationData
> {
  transform(): OrganizationData {
    return {
      id: this.data.id,
      name: this.data.name,
      verificationStatus: this.data.verificationStatus,
      contactEmail: this.data.contactEmail,
      phone: this.data.phone ?? null,
      website: this.data.website ?? null,
      country: this.data.country,
      addressStreet: this.data.addressStreet,
      addressZipCode: this.data.addressZipCode,
      addressCity: this.data.addressCity,
      registrationNumber: this.data.registrationNumber ?? null,
      verificationNote: this.data.verificationNote ?? null,
      reviewNote: this.data.reviewNote ?? null,
      reviewedAt: this.data.reviewedAt?.toISOString() ?? null,
      submittedAt: this.data.submittedAt.toISOString(),
      createdAt: this.data.createdAt.toISOString(),
      updatedAt: this.data.updatedAt?.toISOString() ?? null,
    };
  }
}

export class OrganizationDetailsResource extends JsonResource<
  OrganizationWithCounts,
  OrganizationDetailsData
> {
  transform(): OrganizationDetailsData {
    return {
      ...new OrganizationResource(this.data).transform(),
      ownedCamps: this.data.ownedCamps,
      ownedNewsletters: this.data.ownedNewsletters,
    };
  }
}
