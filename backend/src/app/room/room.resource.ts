import type { Bed, Room } from '@prisma/client';
import type { Room as RoomData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import { BedResource } from '#app/bed/bed.resource.js';

export interface RoomWithBeds extends Room {
  beds: Bed[];
}

export class RoomResource extends JsonResource<RoomWithBeds, RoomData> {
  transform(): RoomData {
    return {
      id: this.data.id,
      name: this.data.name,
      sortOrder: room.sortOrder,
      beds: BedResource.collection(this.data.beds).transform(),
    };
  }
}
