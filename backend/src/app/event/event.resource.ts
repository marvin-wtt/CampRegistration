import {
  type Event as EventResourceData,
  type EventDetails as EventDetailsResourceData,
} from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import { countriesToLocales } from '#utils/countriesToLocales';
import { eventRegistrationStatus } from '#app/event/event.util';
import type { EventWithFreePlaces } from '#app/event/event.types';

export class EventResource extends JsonResource<
  EventWithFreePlaces,
  EventResourceData
> {
  transform(): EventResourceData {
    return {
      id: this.data.id,
      organizationId: this.data.organizationId,
      organizationName: this.data.organization.name,
      organizationVerificationStatus: this.data.organization.verificationStatus,
      listed: this.data.listed,
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
      registrationStatus: eventRegistrationStatus(this.data),
    };
  }
}

export class EventDetailsResource extends JsonResource<
  EventWithFreePlaces,
  EventDetailsResourceData
> {
  transform(): EventDetailsResourceData {
    return {
      ...new EventResource(this.data).transform(),
      // TODO Replace prisma schema with correct definition
      form: this.data.form as unknown as EventDetailsResourceData['form'],
      themes: this.data.themes as unknown as EventDetailsResourceData['themes'],
    };
  }
}
