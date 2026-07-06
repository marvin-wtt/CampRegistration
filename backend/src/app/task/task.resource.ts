import type { Task } from '#generated/prisma/client';
import type { Task as TaskResourceData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export class TaskResource extends JsonResource<Task, TaskResourceData> {
  transform(): TaskResourceData {
    return {
      id: this.data.id,
      title: this.data.title,
      notes: this.data.notes ?? null,
      dueDate: this.data.dueDate ?? null,
      completed: this.data.completed,
      assigneeId: this.data.assigneeId ?? null,
    };
  }
}
