import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import { resolve } from '#core/ioc/container';
import { MailableRegistry } from '#core/mail/mail.registry';
import { RetentionService } from './retention.service.js';
import { RetentionReminderService } from './retention-reminder.service.js';
import { RetentionController } from './retention.controller.js';
import { EventRetentionDeadlineMessage } from './retention.messages.js';
import {
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
    const mailables = resolve(MailableRegistry);
    mailables.register(EventRetentionDeadlineMessage);
    // The one-off reminder this workflow replaced; its queued jobs are void.
    mailables.retire('event:retention-due');
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter('/events/:eventId/retention', new EventRetentionRouter());
    router.useRouter(
      '/organizations/:organizationId/retention',
      new OrganizationRetentionRouter(),
    );
  }

  registerJobs(scheduler: JobScheduler): void {
    scheduler.schedule('retention-reminder', '30 6 * * *', () =>
      resolve(RetentionReminderService).run(),
    );
  }
}
