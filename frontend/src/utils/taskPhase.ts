import type { Task } from '@camp-registration/common/entities';
import { daysBetweenDates, parseLocalDate } from '@/utils/date';

export type TaskPhase =
  | 'overdue'
  | 'dueSoon'
  | 'upcoming'
  | 'noDueDate'
  | 'done';

export function taskPhaseOf(task: Task, dueSoonDays = 7): TaskPhase {
  if (task.completed) {
    return 'done';
  }
  if (!task.dueDate) {
    return 'noDueDate';
  }

  const days = daysBetweenDates(new Date(), parseLocalDate(task.dueDate));

  if (days < 0) {
    return 'overdue';
  }
  if (days <= dueSoonDays) {
    return 'dueSoon';
  }
  return 'upcoming';
}
