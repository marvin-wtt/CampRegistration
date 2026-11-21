import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { resolve } from '#core/ioc/container';
import { registerAuditNameResolver } from '#app/audit/audit.names';
import { AdminAccessService } from '#app/adminAccess/admin-access.service';
import { AdminAccessController } from '#app/adminAccess/admin-access.controller';
import { AdminAccessRouter } from '#app/adminAccess/admin-access.routes';

export class AdminAccessModule implements AppModule {
  bindContainers(options: BindOptions): void {
    options.bind(AdminAccessService).toSelf().inSingletonScope();
    options.bind(AdminAccessController).toSelf().inSingletonScope();
  }

  registerApiRoutes(router: AppRouter): void {
    // An event's audit log names each grant by its reason.
    registerAuditNameResolver('adminAccessGrant', (eventId, ids) =>
      resolve(AdminAccessService).getReasonsByIds(eventId, ids),
    );

    router.useRouter('/admin/access-grants', new AdminAccessRouter());
  }
}
