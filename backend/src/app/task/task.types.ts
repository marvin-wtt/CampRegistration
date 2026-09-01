import type { Task } from '#generated/prisma/client';
import type { ManagerWithRelationships } from '#app/eventManager/event-manager.resource';

export interface TaskWithAssignee extends Task {
  assignee: ManagerWithRelationships | null;
}
