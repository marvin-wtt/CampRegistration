import type {
  Chore,
  ChoreAssignment,
  ChoreAssignmentMember,
} from '#generated/prisma/client.js';

export interface ChoreAssignmentWithRelations extends ChoreAssignment {
  chore: Chore;
  members: ChoreAssignmentMember[];
}
