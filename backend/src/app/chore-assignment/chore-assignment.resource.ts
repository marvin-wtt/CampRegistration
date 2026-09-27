import type { ChoreAssignment as ChoreAssignmentData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import type { ChoreAssignmentWithRelations } from '#app/chore-assignment/chore-assignment.types';

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
      slotId: this.data.slotId,
      batchId: this.data.batchId,
      rotationUnit: this.data.rotationUnit,
      date: this.data.date.toISOString().slice(0, 10),
      status: this.data.status,
      note: this.data.note,
      members: this.data.members.map((member) => ({
        registrationId: member.registrationId,
        role: member.role,
        missed: member.missed,
      })),
    };
  }
}
