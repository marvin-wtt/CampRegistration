import type { Registration, Room, Bed } from '@prisma/client';
import type { Registration as RegistrationData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export interface RegistrationWithBed extends Registration {
  bed?: BedWithRoom | null;
}

interface BedWithRoom extends Bed {
  room: Room;
}

export class RegistrationResource extends JsonResource<
  RegistrationWithBed,
  RegistrationData
> {
  transform(): RegistrationData {
    return {
      id: this.data.id,
      waitingList: this.data.waitingList,
      data: this.data.data,
      computedData: {
        firstName: this.data.firstName,
        lastName: this.data.lastName,
        dataOfBirth: this.data.dateOfBirth?.toISOString().split('T')[0] ?? null,
        gender: this.data.gender,
        address: {
          street: this.data.street,
          city: this.data.city,
          zipCode: this.data.zipCode,
          country: this.data.country,
        },
        role: this.data.role,
        emails: this.data.emails,
      },
      locale: this.data.locale,
      room: this.data.bed ? this.data.bed.room.name : null,
      // Use snake case because form keys should be snake case too
      updatedAt: this.data.updatedAt?.toISOString() ?? null,
      createdAt: this.data.createdAt.toISOString(),
    };
  }
}
