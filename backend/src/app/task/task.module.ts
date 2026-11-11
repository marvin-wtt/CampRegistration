import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { TaskRouter } from '#app/task/task.routes';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { TaskService } from '#app/task/task.service';
import { TaskController } from '#app/task/task.controller';
import { resolve } from '#core/ioc/container';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import { MailableRegistry } from '#core/mail/mail.registry';
import { TaskReminderService } from '#app/task/task-reminder.service';
import { TaskDueReminderMessage } from '#app/task/task.messages';

export class TaskModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(TaskService).toSelf().inSingletonScope();
    options.bind(TaskController).toSelf().inSingletonScope();
    options.bind(TaskRouter).toSelf().inSingletonScope();
    options.bind(TaskReminderService).toSelf().inSingletonScope();
  }

  configure(): void {
    resolve(MailableRegistry).register(TaskDueReminderMessage);
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter('/events/:eventId/tasks', resolve(TaskRouter));
  }

  registerJobs(scheduler: JobScheduler): void {
    // Hourly, so each event's timezone reaches its reminder hour.
    scheduler.schedule('task-due-reminder', '5 * * * *', () =>
      resolve(TaskReminderService).sendDueReminders(),
    );
  }

  registerPermissions(): ScopedPermissions {
    return {
      event: {
        DIRECTOR: [
          'event.tasks.view',
          'event.tasks.create',
          'event.tasks.update',
          'event.tasks.delete',
        ],
        COORDINATOR: [
          'event.tasks.view',
          'event.tasks.create',
          'event.tasks.update',
          'event.tasks.delete',
        ],
        COUNSELOR: [
          'event.tasks.view',
          'event.tasks.create',
          'event.tasks.update',
          'event.tasks.delete',
        ],
        VIEWER: ['event.tasks.view'],
      },
    };
  }
}
