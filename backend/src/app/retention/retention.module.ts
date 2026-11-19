import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import { resolve } from '#core/ioc/container';
import { MailableRegistry } from '#core/mail/mail.registry';
import { RetentionService } from './retention.service.js';
import { RetentionReminderService } from './retention-reminder.service.js';
import { RetentionController } from './retention.controller.js';
import { RetentionDeadlineMessage } from './retention.messages.js';
import {
  AdminRetentionRouter,
  EventRetentionRouter,
  OrganizationRetentionRouter,
} from './retention.routes.js';

/** The retention workflow (docs/privacy.md, 8). */
export class RetentionModule implements AppModule {
  bindContainers(options: BindOptions): void {
    options.bind(RetentionService).toSelf().inSingletonScope();
    options.bind(RetentionReminderService).toSelf().inSingletonScope();
    options.bind(RetentionController).toSelf().inSingletonScope();
  }

  configure(): void {
    resolve(MailableRegistry).register(RetentionDeadlineMessage);
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter('/events/:eventId/retention', new EventRetentionRouter());
    router.useRouter(
      '/organizations/:organizationId/retention',
      new OrganizationRetentionRouter(),
    );
    router.useRouter('/admin/retention', new AdminRetentionRouter());
  }

  registerJobs(scheduler: JobScheduler): void {
    // Syncs the deadlines first, so the reminders read today's dates.
    scheduler.schedule('retention-reminder', '30 6 * * *', () =>
      resolve(RetentionReminderService).run(),
    );
  }
}
