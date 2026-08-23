import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import { resolve } from '#core/ioc/container';
import { MailableRegistry } from '#app/mail/mail.registry';
import { PrivacyNoticeService } from './privacy-notice.service.js';
import { PrivacyNoticeController } from './privacy-notice.controller.js';
import { PrivacyRetentionService } from './privacy-retention.service.js';
import { CampRetentionDueMessage } from './privacy-notice.messages.js';
import {
  CampPrivacyNoticeRouter,
  OrganizationPrivacyNoticeRouter,
} from './privacy-notice.routes.js';

export class PrivacyNoticeModule implements AppModule {
  bindContainers(options: BindOptions): void {
    options.bind(PrivacyNoticeService).toSelf().inSingletonScope();
    options.bind(PrivacyRetentionService).toSelf().inSingletonScope();
    options.bind(PrivacyNoticeController).toSelf().inSingletonScope();
  }

  configure(): void {
    resolve(MailableRegistry).register(CampRetentionDueMessage);
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter(
      '/organizations/:organizationId/privacy-notice',
      new OrganizationPrivacyNoticeRouter(),
    );
    router.useRouter(
      '/camps/:campId/privacy-notice',
      new CampPrivacyNoticeRouter(),
    );
  }

  registerJobs(scheduler: JobScheduler): void {
    scheduler.schedule('retention-reminder', '30 6 * * *', () =>
      resolve(PrivacyRetentionService).sendDueRetentionReminders(),
    );
  }
}
