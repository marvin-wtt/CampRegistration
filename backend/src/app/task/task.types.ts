import type { Task } from '#generated/prisma/client';
import type { ManagerWithRelationships } from '#app/campManager/camp-manager.resource';

export interface TaskWithAssignee extends Task {
  assignee: ManagerWithRelationships | null;
}
