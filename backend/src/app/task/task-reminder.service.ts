import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';
import logger from '#core/logger';
import {
  currentDateInTimeZone,
  dateRange,
  zonedNaiveDateTime,
} from '@camp-registration/common/utils';
import {
  TaskDueReminderMessage,
  type TaskDueReminderPayload,
} from './task.messages.js';

/** Local hours (from inclusive, until exclusive) reminders go out in. */
const REMINDER_HOURS = { from: 8, until: 21 };

/** How many days before the due date the reminder is sent. */
const LEAD_DAYS = 1;

/** Upper bound on reminders sent per run. */
const BATCH_SIZE = 500;

/**
 * Mails each assignee once, from the morning before their open task is due
 * (in the event's timezone). Tasks without an assignee are not reminded.
 * Tasks found in the same run go out as one mail per assignee.
 */
@injectable()
export class TaskReminderService extends BaseService {
  async sendDueReminders(now = new Date()): Promise<void> {
    const windows = await this.dueWindows(now);
    if (windows.length === 0) {
      return;
    }

    const tasks = await this.prisma.task.findMany({
      where: {
        completed: false,
        reminderSentAt: null,
        OR: windows.map(({ timezones, dueDates }) => ({
          dueDate: { in: dueDates },
          event: { timezone: { in: timezones } },
        })),
        assignee: {
          userId: { not: null },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      },
      include: {
        event: { select: { id: true, name: true, timezone: true } },
        assignee: {
          select: {
            user: {
              select: { id: true, name: true, email: true, locale: true },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      // Claimed tasks drop out of the query, so the next run sends the rest.
      take: BATCH_SIZE,
    });

    const todayByTimezone = new Map(
      windows.flatMap(({ timezones, today }) =>
        timezones.map((timezone) => [timezone, today] as const),
      ),
    );
    const digests = new Map<string, TaskDueReminderPayload>();

    for (const task of tasks) {
      const user = task.assignee?.user;
      if (!user || !task.dueDate) {
        continue;
      }

      try {
        // Claim before enqueuing so overlapping runs never send twice. A failed
        // enqueue drops the reminder; it is only a courtesy.
        const { count } = await this.prisma.task.updateMany({
          where: { id: task.id, reminderSentAt: null },
          data: { reminderSentAt: now },
        });
        if (count === 0) {
          continue;
        }
      } catch (error: unknown) {
        logger.error(
          `Failed to claim the reminder for task ${task.id}:`,
          error,
        );
        continue;
      }

      const { id: userId, ...recipient } = user;
      const digest = digests.get(userId) ?? { recipient, tasks: [] };
      digest.tasks.push({
        title: task.title,
        dueDate: task.dueDate,
        due:
          task.dueDate === todayByTimezone.get(task.event.timezone)
            ? 'today'
            : 'tomorrow',
        event: { id: task.event.id, name: task.event.name },
      });
      digests.set(userId, digest);
    }

    await TaskDueReminderMessage.enqueueBulk([...digests.values()]);
  }

  /**
   * The due dates to remind about, per group of event timezones that share a
   * local date and are within the reminder hours.
   */
  private async dueWindows(now: Date): Promise<DueWindow[]> {
    // Every timezone's local date lies within a day of UTC's.
    const candidates = dateRange(
      currentDateInTimeZone('UTC', now),
      -1,
      1 + LEAD_DAYS,
    );
    const events = await this.prisma.event.findMany({
      where: {
        tasks: {
          some: {
            completed: false,
            reminderSentAt: null,
            dueDate: { in: candidates },
          },
        },
      },
      distinct: ['timezone'],
      select: { timezone: true },
    });

    const byDate = new Map<string, string[]>();
    for (const { timezone } of events) {
      const local = zonedNaiveDateTime(now, timezone);
      const date = local.slice(0, 10);
      const hour = Number(local.slice(11, 13));
      if (hour >= REMINDER_HOURS.from && hour < REMINDER_HOURS.until) {
        byDate.set(date, [...(byDate.get(date) ?? []), timezone]);
      }
    }

    return [...byDate].map(([date, timezones]) => ({
      timezones,
      today: date,
      dueDates: dateRange(date, 0, LEAD_DAYS),
    }));
  }
}

interface DueWindow {
  timezones: string[];
  /** The local date these timezones share. */
  today: string;
  dueDates: string[];
}
