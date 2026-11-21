import type { Prisma } from '#generated/prisma/client.js';
import { MailBase } from '#core/mail/mail.base';
import { translate } from '@camp-registration/common/utils';
import { generateUrl } from '#utils/url';
import type { LocalContext, TaskReminderProps } from '#views/emails/types';

export interface TaskDueReminderPayload {
  recipient: { name: string | null; email: string; locale: string | null };
  /** Ordered by due date. */
  tasks: {
    title: string;
    dueDate: string;
    /** Relative to the event's local date when the reminder was queued. */
    due: 'today' | 'tomorrow';
    event: { id: string; name: Prisma.JsonValue };
  }[];
}

/** Reminds an assignee of their tasks that are due soon, in one mail. */
export class TaskDueReminderMessage extends MailBase<TaskDueReminderPayload> {
  static readonly type = 'task:due-digest';

  protected to() {
    const { name, email } = this.payload.recipient;

    return name ? { name, address: email } : email;
  }

  protected locale(): string | undefined {
    return this.payload.recipient.locale ?? undefined;
  }

  protected getTranslationOptions() {
    return {
      namespace: 'task',
      keyPrefix: 'email.dueReminder',
    };
  }

  protected subject(): string {
    return this.title();
  }

  protected content() {
    const t = this.getT();
    const tasks = this.tasks();
    const [first] = tasks;
    const single = tasks.length === 1;

    const groups = single
      ? []
      : [...Map.groupBy(tasks, (task) => task.eventId).values()].map(
          (group) => ({
            eventName: group[0].eventName,
            url: tasksUrl(group[0].eventId),
            tasks: group.map(({ title, label }) => ({ title, when: label })),
          }),
        );

    return {
      template: 'task-reminder',
      context: {
        preview: single
          ? t('single.information', first)
          : tasks.map(({ title }) => title).join(' · '),
        title: this.title(),
        information: single
          ? t('single.information', first)
          : t('multiple.information'),
        groups,
        groupLinkLabel: t('button'),
        button: t('button'),
        url: tasksUrl(first.eventId),
        reason: t(single ? 'footer.cause' : 'footer.causeMultiple'),
      } satisfies LocalContext<TaskReminderProps>,
    };
  }

  private title(): string {
    const t = this.getT();
    const tasks = this.tasks();

    return tasks.length === 1
      ? t(`single.title.${tasks[0].due}`, { title: tasks[0].title })
      : t('multiple.title', { count: tasks.length });
  }

  private tasks() {
    const locale = this.getLocale();
    const t = this.getT();

    return this.payload.tasks.map((task) => {
      const date = formatDueDate(task.dueDate, locale);

      return {
        title: task.title,
        eventId: task.event.id,
        eventName:
          translate(
            task.event.name as string | Record<string, string>,
            locale,
          ) ?? '',
        due: task.due,
        // "tomorrow (22.11.2026)" inside a sentence, "Due tomorrow · …" in a list.
        when: t(`when.${task.due}`, { date }),
        label: t(`label.${task.due}`, { date }),
      };
    });
  }
}

function tasksUrl(eventId: string): string {
  return generateUrl(['management', 'events', eventId, 'tasks']);
}

/** `YYYY-MM-DD` as a numeric date in the recipient's locale. */
function formatDueDate(dueDate: string, locale: string): string {
  const [year, month, day] = dueDate.split('-').map(Number);

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
