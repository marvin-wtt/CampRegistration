import type { Task as TaskResourceData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import { EventManagerIdentityResource } from '#app/eventManager/event-manager.resource';
import type { TaskWithAssignee } from '#app/task/task.types';

export class TaskResource extends JsonResource<
  TaskWithAssignee,
  TaskResourceData
> {
  transform(): TaskResourceData {
    return {
      id: this.data.id,
      title: this.data.title,
      notes: this.data.notes ?? null,
      dueDate: this.data.dueDate ?? null,
      completed: this.data.completed,
      assigneeId: this.data.assigneeId ?? null,
      assignee: this.data.assignee
        ? new EventManagerIdentityResource(this.data.assignee).transform()
        : null,
    };
  }
}
