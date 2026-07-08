import type { Camp } from '#generated/prisma/client.js';
import {
  Camp as CampResourceData,
  CampDetails as CampDetailsResourceData,
  CampRegistrationStatus,
} from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import { countriesToLocales } from '#utils/countriesToLocales';

export interface CampWithFreePlaces extends Camp {
  freePlaces: Record<string, number> | number;
}

export class CampResource extends JsonResource<
  CampWithFreePlaces,
  CampResourceData
> {
  transform(): CampResourceData {
    return {
      id: this.data.id,
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
      registrationStatus: campRegistrationStatus(
        this.data.registrationOpensAt,
        this.data.registrationClosesAt,
      ),
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

/**
 * Derive the registration status from the registration window. Single source of
 * truth shared by the backend resource and any client that needs the status.
 */
export function campRegistrationStatus(
  registrationOpensAt: string | Date | null,
  registrationClosesAt: string | Date | null,
  now: Date = new Date(),
): CampRegistrationStatus {
  if (!registrationOpensAt && !registrationClosesAt) {
    return 'closed';
  }

  if (registrationOpensAt && now < new Date(registrationOpensAt)) {
    return 'upcoming';
  }

  if (registrationClosesAt && now > new Date(registrationClosesAt)) {
    return 'closed';
  }

  return 'open';
}
