import { auth, guard } from '#middlewares/index';
import { hasEventPermission } from '#app/event/event.guard';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { AuditController } from '#app/audit/audit.controller';
import { resolve } from '#core/ioc/container';

// A registration's trail, at the same tier as viewing the registration.
export class AuditRouter extends ModuleRouter {
  protected registerBindings() {
    // `event` and `registration` are bound globally.
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

export class EventAuditRouter extends ModuleRouter {
  protected registerBindings() {
    // `event` is bound globally.
  }

  protected defineRoutes() {
    const auditController = resolve(AuditController);

    this.router.get(
      '/',
      auth(),
      guard(hasEventPermission('event.audit.view')),
      controller(auditController, 'indexForEvent'),
    );

    this.router.get(
      '/actors',
      auth(),
      guard(hasEventPermission('event.audit.view')),
      controller(auditController, 'actorsForEvent'),
    );
  }
}
