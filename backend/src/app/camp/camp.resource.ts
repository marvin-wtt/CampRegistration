import type {
  Camp as CampResourceData,
  CampDetails as CampDetailsResourceData,
} from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import { countriesToLocales } from '#utils/countriesToLocales';
import type { CampWithFreePlacesAndFiles } from '#app/camp/camp.types';

export class CampResource extends JsonResource<
  CampWithFreePlacesAndFiles,
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
    };
  }
}

export class CampDetailsResource extends JsonResource<
  CampWithFreePlacesAndFiles,
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
