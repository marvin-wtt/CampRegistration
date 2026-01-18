import { auth, authLimiter, guest } from '#middlewares/index';
import { AuthController } from '#app/auth/auth.controller';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { resolve } from '#core/ioc/container';

export class AuthRouter extends ModuleRouter {
  protected registerBindings() {
    // No model bindings needed for auth routes
  }

  protected defineRoutes() {
    const authController = resolve(AuthController);

    this.router.use(authLimiter);

    this.router.post(
      '/register',
      guest(),
      controller(authController, 'register'),
    );
    this.router.post('/login', controller(authController, 'login'));
    this.router.post('/verify-otp', controller(authController, 'verifyOTP'));
    this.router.post('/logout', auth(), controller(authController, 'logout'));
    this.router.post(
      '/refresh-tokens',
      controller(authController, 'refreshTokens'),
    );
    this.router.post(
      '/forgot-password',
      guest(),
      controller(authController, 'forgotPassword'),
    );
    this.router.post(
      '/reset-password',
      guest(),
      controller(authController, 'resetPassword'),
    );
    this.router.post(
      '/send-verification-email',
      controller(authController, 'sendVerificationEmail'),
    );
    this.router.post(
      '/verify-email',
      controller(authController, 'verifyEmail'),
    );
    this.router.get('/csrf-token', controller(authController, 'getCsrfToken'));
  }
}
