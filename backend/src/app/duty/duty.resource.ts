import type { Duty } from '#generated/prisma/client.js';
import type { Duty as DutyData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export class DutyResource extends JsonResource<Duty, DutyData> {
  transform(): DutyData {
    return {
      id: this.data.id,
      name: this.data.name,
      sortOrder: this.data.sortOrder,
      defaultCount: this.data.defaultCount ?? null,
      excludeStaff: this.data.excludeStaff,
      balanceCountries: this.data.balanceCountries,
    };
  }
}
