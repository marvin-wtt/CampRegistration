import type { ProgramPublishedDay } from '#generated/prisma/client';
import type { ProgramPublishedDay as ProgramPublishedDayResourceData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export class ProgramPublishedDayResource extends JsonResource<
  ProgramPublishedDay,
  ProgramPublishedDayResourceData
> {
  transform(): ProgramPublishedDayResourceData {
    return {
      id: this.data.id,
      eventId: this.data.eventId,
      date: this.data.date,
      plan: this.data.plan as ProgramPublishedDayResourceData['plan'],
    };
  }
}
