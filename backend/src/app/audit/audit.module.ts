import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { AuditService } from '#app/audit/audit.service';
import { AuditController } from '#app/audit/audit.controller';
import { AuditRouter, EventAuditRouter } from '#app/audit/audit.routes';
import { resolve } from '#core/ioc/container';
import logger from '#core/logger';
import { unregisterAllAuditNameResolvers } from '#app/audit/audit.names';

export class AuditModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(AuditService).toSelf().inSingletonScope();
    options.bind(AuditController).toSelf().inSingletonScope();
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter(
      '/events/:eventId/registrations/:registrationId/audit',
      new AuditRouter(),
    );
    router.useRouter('/events/:eventId/audit', new EventAuditRouter());
  }

  registerPermissions(): ScopedPermissions {
    return {
      event: {
        DIRECTOR: ['event.audit.view'],
        COORDINATOR: ['event.audit.view'],
      },
    };
  }

  registerJobs(scheduler: JobScheduler): void {
    scheduler.schedule('audit-log-retention-cleanup', '0 5 * * *', async () => {
      const service = resolve(AuditService);
      const count = await service.purgeExpiredAuditLogs();
      logger.info(`Removed ${count.toString()} audit log entry(ies)`);
      const names = await service.purgeExpiredDeletedUsers();
      logger.info(`Removed ${names.toString()} deleted user name(s)`);
    });
  }

  shutdown(): void {
    unregisterAllAuditNameResolvers();
  }
}
