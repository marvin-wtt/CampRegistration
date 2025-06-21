import type { AppModule, AppRouter } from '#core/base/AppModule';
import { AuthRouter } from '#app/auth/auth.routes';

export class AuthModule implements AppModule {
  registerRoutes(router: AppRouter): void {
    router.useRouter('/auth', new AuthRouter());
  }
}
