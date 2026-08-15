import { TaskFactory } from '../factories/task.factory';
import prisma from '../client';
import { BaseSeeder } from './BaseSeeder';
import { CAMP_IDS, USER_IDS } from './ids';
import moment from 'moment';

type TaskData = {
  title: string;
  notes?: string;
  /** Days before the camp start date; `null` for a task without a due date. */
  dueDaysBeforeStart?: number | null;
  completed?: boolean;
  /** Resolved to that user's manager record for the camp, if they have one. */
  assigneeUserId?: string;
};

const SUMMER_TASKS: TaskData[] = [
  {
    title: 'Book transportation',
    notes: 'Reserve the bus for arrival and departure days.',
    dueDaysBeforeStart: 45,
    completed: true,
    assigneeUserId: USER_IDS.john,
  },
  {
    title: 'Confirm insurance coverage',
    notes: 'Check that all participants are covered for the camp dates.',
    dueDaysBeforeStart: 40,
    assigneeUserId: USER_IDS.john,
  },
  {
    title: 'Print name tags',
    dueDaysBeforeStart: 7,
    assigneeUserId: USER_IDS.erika,
  },
  {
    title: 'Prepare welcome packets',
    notes: 'Include camp map, schedule and rules handout.',
    dueDaysBeforeStart: 3,
    assigneeUserId: USER_IDS.erika,
  },
  {
    title: 'Order first aid supplies',
    dueDaysBeforeStart: 30,
    assigneeUserId: USER_IDS.peter,
  },
  {
    title: 'Confirm kitchen staffing',
    notes: 'Contact the catering team to confirm headcount.',
    dueDaysBeforeStart: null,
    completed: true,
    assigneeUserId: USER_IDS.peter,
  },
  {
    // Overdue and unassigned.
    title: 'Collect missing medical forms',
    notes: 'Three participants have not returned the form yet.',
    dueDaysBeforeStart: 120,
  },
  {
    title: 'Set up check-in table',
    dueDaysBeforeStart: null,
  },
];

const CITY_TASKS: TaskData[] = [
  {
    title: 'Daily attendance check',
    notes: 'Count participants after every excursion.',
    dueDaysBeforeStart: -1,
    assigneeUserId: USER_IDS.peter,
  },
  {
    title: 'Return borrowed sports equipment',
    dueDaysBeforeStart: -7,
  },
  {
    title: 'Collect feedback forms',
    dueDaysBeforeStart: -6,
    assigneeUserId: USER_IDS.john,
  },
];

class TaskSeeder extends BaseSeeder {
  name(): string {
    return 'task';
  }

  async run(): Promise<void> {
    await this.seedCamp(CAMP_IDS.summer, SUMMER_TASKS);
    await this.seedCamp(CAMP_IDS.city, CITY_TASKS);
  }

  private async seedCamp(campId: string, tasks: TaskData[]): Promise<void> {
    const camp = await prisma.camp.findUniqueOrThrow({ where: { id: campId } });
    const managers = await prisma.campManager.findMany({ where: { campId } });

    const managerIdOf = (userId: string | undefined) =>
      managers.find((manager) => manager.userId === userId)?.id;

    for (const task of tasks) {
      const { dueDaysBeforeStart, assigneeUserId, ...rest } = task;
      const assigneeId = managerIdOf(assigneeUserId);

      await TaskFactory.create({
        camp: { connect: { id: campId } },
        dueDate:
          dueDaysBeforeStart == null
            ? null
            : moment(camp.startAt)
                .subtract(dueDaysBeforeStart, 'days')
                .format('YYYY-MM-DD'),
        completed: false,
        notes: null,
        ...rest,
        ...(assigneeId ? { assignee: { connect: { id: assigneeId } } } : {}),
      });
    }
  }
}

export default new TaskSeeder();
