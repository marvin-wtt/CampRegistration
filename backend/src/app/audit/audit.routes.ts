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

/**
 * Mounted at `/camps/:campId/audit` — the camp-wide audit log covering every
 * entity type scoped to the camp. The `camp` binding is registered globally by
 * `CampRouter`, so no bindings are needed here.
 */
export class CampAuditRouter extends ModuleRouter {
  protected registerBindings() {
    // Reuses the global `camp` binding.
  }

  protected defineRoutes() {
    const auditController = resolve(AuditController);

    this.router.get(
      '/',
      auth(),
      guard(campManager('camp.audit.view')),
      controller(auditController, 'indexForCamp'),
    );
  }
}
