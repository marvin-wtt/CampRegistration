import type { ChoreAssignment as ChoreAssignmentData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import type { ChoreAssignmentWithRelations } from '#app/choreAssignment/choreAssignment.types';

export class ChoreAssignmentResource extends JsonResource<
  ChoreAssignmentWithRelations,
  ChoreAssignmentData
> {
  transform(): ChoreAssignmentData {
    return {
      id: this.data.id,
      choreId: this.data.choreId,
      chore: {
        id: this.data.chore.id,
        name: this.data.chore.name,
      },
      rotationUnit: this.data.rotationUnit,
      date: this.data.date.toISOString().split('T')[0],
      slot: this.data.slot ?? null,
      registrationIds: this.data.members.map((member) => member.registrationId),
    };
  }
}
