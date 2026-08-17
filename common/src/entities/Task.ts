import type { Identifiable } from './Identifiable.js';
import type { CampManagerIdentity } from './CampManager.js';

export interface Task extends Identifiable {
  title: string;
  notes: string | null;
  dueDate: string | null;
  completed: boolean;
  assigneeId: string | null;
  assignee: CampManagerIdentity | null;
}

export type TaskCreateData = Partial<
  Omit<Task, 'id' | 'title' | 'completed' | 'assignee'>
> &
  Pick<Task, 'title'>;

export type TaskUpdateData = Partial<TaskCreateData & Pick<Task, 'completed'>>;
