import { auth } from '#middlewares/auth.middleware';
import { TotPController } from '#app/totp/totp.controller';
import { authLimiter } from '#middlewares/index';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { resolve } from '#core/ioc/container';

export class TotpRouter extends ModuleRouter {
  protected registerBindings() {
    // No model bindings needed for TOTP routes
  }

  protected defineRoutes() {
    const totpController = resolve(TotPController);

    this.router.use(authLimiter);
    this.router.use(auth());

    this.router.post('/setup', controller(totpController, 'setup'));
    this.router.post('/enable', controller(totpController, 'enable'));
    this.router.post('/disable', controller(totpController, 'disable'));
  }
}
