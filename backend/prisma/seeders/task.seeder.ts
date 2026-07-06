import { TaskFactory } from '../factories/task.factory';
import { Camp } from '#generated/prisma/client.js';

type TaskData = {
  title: string;
  notes?: string;
  dueDate?: string | null;
  completed?: boolean;
};

const TASKS: TaskData[] = [
  {
    title: 'Book transportation',
    notes: 'Reserve the bus for arrival and departure days.',
    dueDate: '2026-10-15',
    completed: true,
  },
  {
    title: 'Confirm insurance coverage',
    notes: 'Check that all participants are covered for the camp dates.',
    dueDate: '2026-10-20',
  },
  {
    title: 'Print name tags',
    dueDate: '2026-11-10',
  },
  {
    title: 'Prepare welcome packets',
    notes: 'Include camp map, schedule and rules handout.',
    dueDate: '2026-11-15',
  },
  {
    title: 'Order first aid supplies',
    dueDate: '2026-10-25',
  },
  {
    title: 'Confirm kitchen staffing',
    notes: 'Contact the catering team to confirm headcount.',
    completed: true,
  },
  {
    title: 'Set up check-in table',
  },
];

export class TaskSeeder {
  constructor(private camp: Camp) {}

  async seed(): Promise<void> {
    for (const task of TASKS) {
      await TaskFactory.create({
        camp: { connect: { id: this.camp.id } },
        ...task,
      });
    }
  }
}
