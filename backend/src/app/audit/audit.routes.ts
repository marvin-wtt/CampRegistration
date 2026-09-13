import { auth, guard } from '#middlewares/index';
import { hasEventPermission } from '#app/event/event.guard';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { AuditController } from '#app/audit/audit.controller';
import { resolve } from '#core/ioc/container';

/**
 * Mounted at `/events/:eventId/registrations/:registrationId/audit`. The `event`
 * and `registration` model bindings are registered globally by their own
 * routers, so no bindings are needed here. Guarded at the same sensitivity tier
 * as viewing the registration itself.
 */
export class AuditRouter extends ModuleRouter {
  protected registerBindings() {
    // Reuses the global `event` / `registration` bindings.
  }

  protected defineRoutes() {
    const auditController = resolve(AuditController);

    this.router.get(
      '/',
      auth(),
      guard(hasEventPermission('event.registrations.view')),
      controller(auditController, 'indexForRegistration'),
    );
  }
}

/**
 * Mounted at `/events/:eventId/audit` — the event-wide audit log covering every
 * entity type scoped to the event. The `event` binding is registered globally by
 * `EventRouter`, so no bindings are needed here.
 */
export class EventAuditRouter extends ModuleRouter {
  protected registerBindings() {
    // Reuses the global `event` binding.
  }

  protected defineRoutes() {
    const auditController = resolve(AuditController);

    this.router.get(
      '/',
      auth(),
      guard(hasEventPermission('event.audit.view')),
      controller(auditController, 'indexForEvent'),
    );
  }
}
