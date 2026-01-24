import type { ProgramEvent } from '@prisma/client';
import type { ProgramEvent as ProgramEventResourceData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export class ProgramEventResource extends JsonResource<
  ProgramEvent,
  ProgramEventResourceData
> {
  transform(): ProgramEventResourceData {
    return {
      id: this.data.id,
      title: this.data.title,
      details: this.data.details,
      location: this.data.location,
      date: this.data.date ?? null,
      time: this.data.time ?? null,
      duration: this.data.duration ?? null,
      color: this.data.color ?? 'white',
      side: (this.data.side as ProgramEventResourceData['side']) ?? null,
    };
  }
}
