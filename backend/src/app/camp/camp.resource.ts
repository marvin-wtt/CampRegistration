import type {
  Camp,
  OrganizationVerificationStatus,
} from '#generated/prisma/client.js';
import {
  type Camp as CampResourceData,
  type CampDetails as CampDetailsResourceData,
} from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import { countriesToLocales } from '#utils/countriesToLocales';
import { campRegistrationStatus } from '#app/camp/camp.util';

/**
 * A camp as every service query loads it: the record itself, the participant
 * countries `freePlaces` is derived from, and the owning organization's
 * moderation status for the publication and registration guards.
 */
export interface CampWithFreePlaces extends Camp {
  freePlaces: Record<string, number> | number;
  registrations: { country: string | null }[];
  organization: {
    id: string;
    name: string;
    verificationStatus: OrganizationVerificationStatus;
  };
}

export class CampResource extends JsonResource<
  CampWithFreePlaces,
  CampResourceData
> {
  transform(): CampResourceData {
    return {
      id: this.data.id,
      organizationId: this.data.organizationId,
      organizationName: this.data.organization.name,
      organizationVerificationStatus: this.data.organization.verificationStatus,
      public: this.data.public,
      registrationOpensAt: this.data.registrationOpensAt?.toISOString() ?? null,
      registrationClosesAt:
        this.data.registrationClosesAt?.toISOString() ?? null,
      confirmationMode: this.data.confirmationMode,
      countries: this.data.countries,
      locales: countriesToLocales(this.data.countries),
      name: this.data.name,
      organizer: this.data.organizer,
      contactEmail: this.data.contactEmail,
      maxParticipants: this.data.maxParticipants,
      minAge: this.data.minAge,
      maxAge: this.data.maxAge,
      startAt: this.data.startAt.toISOString(),
      endAt: this.data.endAt.toISOString(),
      price: this.data.price,
      location: this.data.location ?? null,
      freePlaces: this.data.freePlaces,
      registrationStatus: campRegistrationStatus(this.data),
    };
  }
}

export class CampDetailsResource extends JsonResource<
  CampWithFreePlaces,
  CampDetailsResourceData
> {
  transform(): CampDetailsResourceData {
    return {
      ...new CampResource(this.data).transform(),
      // TODO Replace prisma schema with correct definition
      form: this.data.form as unknown as CampDetailsResourceData['form'],
      themes: this.data.themes as unknown as CampDetailsResourceData['themes'],
    };
  }
}
