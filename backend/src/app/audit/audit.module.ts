import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import { AuditService } from '#app/audit/audit.service';
import { AuditController } from '#app/audit/audit.controller';
import { AuditRouter } from '#app/audit/audit.routes';
import { resolve } from '#core/ioc/container';
import logger from '#core/logger';

export class AuditModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(AuditService).toSelf().inSingletonScope();
    options.bind(AuditController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter(
      '/camps/:campId/registrations/:registrationId/audit',
      new AuditRouter(),
    );
  }

  registerJobs(scheduler: JobScheduler): void {
    scheduler.schedule('audit-log-retention-cleanup', '0 5 * * *', async () => {
      const count = await resolve(AuditService).purgeExpiredAuditLogs();
      logger.info(`Removed ${count.toString()} audit log entry(ies)`);
    });

    scheduler.schedule('audit-log-ip-scrub', '30 5 * * *', async () => {
      const count = await resolve(AuditService).purgeExpiredActorIps();
      logger.info(`Scrubbed IP from ${count.toString()} audit log entry(ies)`);
    });
  }
}
