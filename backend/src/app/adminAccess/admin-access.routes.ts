import { auth } from '#core/auth/auth.middleware';
import { guard } from '#core/guard';
import { controller } from '#core/router/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { resolve } from '#core/ioc/container';
import { authLimiter } from '#core/rate-limit/limiters';
import { AdminAccessController } from '#app/adminAccess/admin-access.controller';

export class AdminAccessRouter extends ModuleRouter {
  protected registerBindings() {
    // Grants are looked up by the requesting administrator, not bound.
  }

  protected defineRoutes() {
    const adminAccessController = resolve(AdminAccessController);

    this.router.use(auth());

    // Takes a TOTP code, so it shares the auth routes' attempt limit.
    this.router.post(
      '/',
      authLimiter,
      guard(),
      controller(adminAccessController, 'store'),
    );
    this.router.delete(
      '/:grantId',
      guard(),
      controller(adminAccessController, 'destroy'),
    );
  }
}
