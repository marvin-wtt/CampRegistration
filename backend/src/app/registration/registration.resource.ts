import type { Registration, Room, Bed } from '@prisma/client';
import type { Registration as RegistrationData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource.js';

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
      campData: this.data.campData,
      locale: this.data.locale,
      room: this.data.bed ? this.data.bed.room.name : null,
      // Use snake case because form keys should be snake case too
      updatedAt: this.data.updatedAt?.toISOString() ?? null,
      createdAt: this.data.createdAt.toISOString(),
    };
  }
}
