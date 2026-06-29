import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { AuditService } from '#app/audit/audit.service';
import { AuditController } from '#app/audit/audit.controller';
import { AuditRouter } from '#app/audit/audit.routes';

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
}
