import type { Prisma } from '#generated/prisma/client.js';
import { MailBase } from '#core/mail/mail.base';
import { translate } from '@camp-registration/common/utils';
import { generateUrl } from '#utils/url';
import { resolveActionCardText } from '#core/mail/actionCardText';
import type { ActionCardProps, LocalContext } from '#views/emails/types';

export interface TaskDueReminderPayload {
  task: { id: string; title: string; dueDate: string };
  event: { id: string; name: Prisma.JsonValue };
  recipient: { name: string | null; email: string; locale: string | null };
}

/** Reminds a task's assignee that it is due soon. */
export class TaskDueReminderMessage extends MailBase<TaskDueReminderPayload> {
  static readonly type = 'task:due-reminder';

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
    return this.getT()('subject', this.context());
  }

  protected content() {
    const t = this.getT();
    const { event } = this.payload;

    return {
      template: 'task-due-reminder',
      context: {
        ...resolveActionCardText(t, this.context()),
        url: generateUrl(['management', 'events', event.id, 'tasks']),
      } satisfies LocalContext<ActionCardProps>,
    };
  }

  private context() {
    const locale = this.locale() ?? 'en';
    const { event, task } = this.payload;

    return {
      task: { title: task.title },
      event: {
        name: translate(event.name as string | Record<string, string>, locale),
      },
      dueDate: formatDueDate(task.dueDate, locale),
    };
  }
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
