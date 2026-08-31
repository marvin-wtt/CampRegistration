import type { DutyAssignment as DutyAssignmentData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import type { DutyAssignmentWithRelations } from '#app/dutyAssignment/dutyAssignment.types';

export class DutyAssignmentResource extends JsonResource<
  DutyAssignmentWithRelations,
  DutyAssignmentData
> {
  transform(): DutyAssignmentData {
    return {
      id: this.data.id,
      dutyId: this.data.dutyId,
      duty: {
        id: this.data.duty.id,
        name: this.data.duty.name,
        rotationUnit: this.data.duty.rotationUnit,
      },
      date: this.data.date,
      slot: this.data.slot ?? null,
      registrationIds: this.data.members.map((member) => member.registrationId),
    };
  }
}
