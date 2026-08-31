import type {
  Duty,
  DutyAssignment,
  DutyAssignmentMember,
} from '#generated/prisma/client.js';

export interface DutyAssignmentWithRelations extends DutyAssignment {
  duty: Duty;
  members: DutyAssignmentMember[];
}
