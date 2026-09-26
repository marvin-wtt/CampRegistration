import type { ProgramItem } from '#generated/prisma/client';
import type { ProgramItem as ProgramItemResourceData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export class ProgramItemResource extends JsonResource<
  ProgramItem,
  ProgramItemResourceData
> {
  transform(): ProgramItemResourceData {
    return {
      id: this.data.id,
      title: this.data.title,
      details: this.data.details,
      location: this.data.location,
      date: this.data.date ?? null,
      time: this.data.time ?? null,
      duration: this.data.duration ?? null,
      color: this.data.color ?? null,
      plan: this.data.plan as ProgramItemResourceData['plan'],
    };
  }
}
