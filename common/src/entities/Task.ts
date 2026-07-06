import type { Identifiable } from './Identifiable.js';

export interface Task extends Identifiable {
  title: string;
  notes: string | null;
  dueDate: string | null;
  completed: boolean;
  assigneeId: string | null;
}

export type TaskCreateData = Partial<Omit<Task, 'id' | 'title' | 'completed'>> &
  Pick<Task, 'title'>;

export type TaskUpdateData = Partial<TaskCreateData & Pick<Task, 'completed'>>;
