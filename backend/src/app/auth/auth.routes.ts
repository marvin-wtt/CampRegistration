import { auth, authLimiter, guest } from '#middlewares/index';
import authController from './auth.controller.js';
import { ModuleRouter } from '#core/router/ModuleRouter';

export class AuthRouter extends ModuleRouter {
  protected registerBindings() {
    // No model bindings needed for auth routes
  }

  protected defineRoutes() {
    this.router.use(authLimiter);

    this.router.post(
      '/register',
      guest(),
      this.controller(authController, 'register'),
    );
    this.router.post('/login', this.controller(authController, 'login'));
    this.router.post(
      '/verify-otp',
      this.controller(authController, 'verifyOTP'),
    );
    this.router.post(
      '/logout',
      auth(),
      this.controller(authController, 'logout'),
    );
    this.router.post(
      '/refresh-tokens',
      this.controller(authController, 'refreshTokens'),
    );
    this.router.post(
      '/forgot-password',
      guest(),
      this.controller(authController, 'forgotPassword'),
    );
    this.router.post(
      '/reset-password',
      guest(),
      this.controller(authController, 'resetPassword'),
    );
    this.router.post(
      '/send-verification-email',
      this.controller(authController, 'sendVerificationEmail'),
    );
    this.router.post(
      '/verify-email',
      this.controller(authController, 'verifyEmail'),
    );
    this.router.get(
      '/csrf-token',
      this.controller(authController, 'getCsrfToken'),
    );
  }
}
