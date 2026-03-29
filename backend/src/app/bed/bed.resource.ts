import type { Bed } from '#/generated/prisma/client.js';
import type { Bed as BedData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export class BedResource extends JsonResource<Bed, BedData> {
  transform(): BedData {
    return {
      id: this.data.id,
      registrationId: this.data.registrationId ?? null,
    };
  }
}
