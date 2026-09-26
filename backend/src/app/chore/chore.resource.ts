import type { Chore } from '#generated/prisma/client.js';
import type { Chore as ChoreData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export class ChoreResource extends JsonResource<Chore, ChoreData> {
  transform(): ChoreData {
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
