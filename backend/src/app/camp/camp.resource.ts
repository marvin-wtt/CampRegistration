import { Camp } from '@prisma/client';
import type {
  Camp as CampResourceData,
  CampDetails as CampDetailsResourceData,
} from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource.js';

export class CampResource extends JsonResource<Camp, CampResourceData> {
  transform() {
    return {
      id: this.data.id,
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
      price: this.data.price ?? null,
      location: this.data.location ?? null,
      freePlaces: this.data.freePlaces ?? null,
    };
  }
}

export class CampDetailsResource extends JsonResource<
  Camp,
  CampDetailsResourceData
> {
  transform() {
    return {
      ...new CampResource(this.data).transform(),
      form: this.data.form,
      themes: this.data.themes,
    };
  }
}
