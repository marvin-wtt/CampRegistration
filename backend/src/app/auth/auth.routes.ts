import { auth, authLimiter, guest, refreshLimiter } from '#middlewares';
import { ensureCsrfSession } from '#middlewares/csrf.middleware';
import { AuthController } from '#app/auth/auth.controller';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { resolve } from '#core/ioc/container';

export class AuthRouter extends ModuleRouter {
  protected registerBindings() {
    // No model bindings needed for auth routes
  }

  protected defineRoutes() {
    const authController: AuthController = resolve(AuthController);

    this.router.post(
      '/register',
      authLimiter,
      guest(),
      controller(authController, 'register'),
    );
    this.router.post(
      '/login',
      authLimiter,
      controller(authController, 'login'),
    );
    this.router.post(
      '/verify-otp',
      authLimiter,
      controller(authController, 'verifyOTP'),
    );
    this.router.post(
      '/logout',
      authLimiter,
      auth(),
      controller(authController, 'logout'),
    );
    // Not authLimiter: failed refreshes must not lock users out of logging in
    this.router.post(
      '/refresh-tokens',
      refreshLimiter,
      controller(authController, 'refreshTokens'),
    );
    this.router.post(
      '/forgot-password',
      authLimiter,
      guest(),
      controller(authController, 'forgotPassword'),
    );
    this.router.post(
      '/reset-password',
      authLimiter,
      guest(),
      controller(authController, 'resetPassword'),
    );
    this.router.post(
      '/send-verification-email',
      authLimiter,
      controller(authController, 'sendVerificationEmail'),
    );
    this.router.post(
      '/verify-email',
      authLimiter,
      controller(authController, 'verifyEmail'),
    );
    this.router.get(
      '/csrf-token',
      authLimiter,
      ensureCsrfSession,
      controller(authController, 'getCsrfToken'),
    );
  }
}
