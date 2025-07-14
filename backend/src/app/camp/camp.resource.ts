import type { Camp } from '@prisma/client';
import type {
  Camp as CampResourceData,
  CampDetails as CampDetailsResourceData,
} from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

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
      type: this.data.type ?? null,
      public: this.data.public,
      active: this.data.active,
      countries: this.data.countries,
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
