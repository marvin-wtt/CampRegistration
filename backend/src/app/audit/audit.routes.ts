import { auth, guard } from '#middlewares/index';
import { campManager } from '#app/campManager/camp-manager.guard';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { AuditController } from '#app/audit/audit.controller';
import { resolve } from '#core/ioc/container';

/**
 * Mounted at `/camps/:campId/registrations/:registrationId/audit`. The `camp`
 * and `registration` model bindings are registered globally by their own
 * routers, so no bindings are needed here. Guarded at the same sensitivity tier
 * as viewing the registration itself.
 */
export class AuditRouter extends ModuleRouter {
  protected registerBindings() {
    // Reuses the global `camp` / `registration` bindings.
  }

  protected defineRoutes() {
    const auditController = resolve(AuditController);

    this.router.get(
      '/',
      auth(),
      guard(campManager('camp.registrations.view')),
      controller(auditController, 'indexForRegistration'),
    );
  }
}
