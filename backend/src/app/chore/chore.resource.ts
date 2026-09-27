import type { Chore as ChoreData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import type { ChoreWithSlots } from '#app/chore-assignment/chore-assignment.types';

export class ChoreResource extends JsonResource<ChoreWithSlots, ChoreData> {
  transform(): ChoreData {
    return {
      id: this.data.id,
      name: this.data.name,
      sortOrder: this.data.sortOrder,
      defaultCount: this.data.defaultCount ?? null,
      supervisorCount: this.data.supervisorCount,
      eligibility: this.data.eligibility,
      effort: this.data.effort,
      defaultRotationUnit: this.data.defaultRotationUnit,
      balanceCountries: this.data.balanceCountries,
      slots: this.data.slots.map((slot) => ({
        id: slot.id,
        name: slot.name,
        sortOrder: slot.sortOrder,
        headcount: slot.headcount,
        supervisorCount: slot.supervisorCount,
        effort: slot.effort,
      })),
    };
  }
}
