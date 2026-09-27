import type {
  Chore,
  ChoreAssignment,
  ChoreAssignmentMember,
  ChoreSlot,
} from '#generated/prisma/client.js';

export interface ChoreAssignmentWithRelations extends ChoreAssignment {
  chore: Chore;
  members: ChoreAssignmentMember[];
}

export interface ChoreWithSlots extends Chore {
  slots: ChoreSlot[];
}
