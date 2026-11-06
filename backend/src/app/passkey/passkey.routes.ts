import { auth } from '#middlewares/auth.middleware';
import { PasskeyController } from '#app/passkey/passkey.controller';
import { authLimiter } from '#middlewares/index';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { resolve } from '#core/ioc/container';

export class PasskeyRouter extends ModuleRouter {
  protected registerBindings() {
    // Passkeys are looked up scoped to the authenticated user by the service
  }

  protected defineRoutes() {
    const passkeyController = resolve(PasskeyController);

    this.router.use(auth());

    this.router.get('/', controller(passkeyController, 'index'));
    this.router.post(
      '/registration/options',
      authLimiter,
      controller(passkeyController, 'registrationOptions'),
    );
    this.router.post(
      '/registration/verify',
      authLimiter,
      controller(passkeyController, 'registrationVerify'),
    );
    this.router.patch('/:passkeyId', controller(passkeyController, 'update'));
    this.router.delete(
      '/:passkeyId',
      authLimiter,
      controller(passkeyController, 'destroy'),
    );
  }
}
