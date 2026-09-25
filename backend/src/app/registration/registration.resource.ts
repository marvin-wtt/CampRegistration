import type { Registration, Room, Bed } from '#generated/prisma/client.js';
import type { Registration as RegistrationData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import { customFileSlots } from '#app/registration/registration.helper';

export interface RegistrationWithBed extends Registration {
  bed?: BedWithRoom | null;
  files?: FileSlot[];
}

interface BedWithRoom extends Bed {
  room: Room;
}

interface FileSlot {
  id: string;
  field: string | null;
}

export class RegistrationResource extends JsonResource<
  RegistrationWithBed,
  RegistrationData
> {
  transform(): RegistrationData {
    return {
      id: this.data.id,
      status: this.data.status,
      data: this.data.data,
      computedData: {
        firstName: this.data.firstName,
        lastName: this.data.lastName,
        dateOfBirth: this.data.dateOfBirth?.toISOString().split('T')[0] ?? null,
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
      customData: this.data.customData ?? {},
      // Derived from the File rows — the single source of truth for custom
      // file slots (`field = 'custom:<slot>'`).
      customFiles: customFileSlots(this.data.files ?? []),
      locale: this.data.locale,
      room: this.data.bed ? this.data.bed.room.name : null,
      // Use snake case because form keys should be snake case too
      updatedAt: this.data.updatedAt?.toISOString() ?? null,
      createdAt: this.data.createdAt.toISOString(),
    };
  }
}
