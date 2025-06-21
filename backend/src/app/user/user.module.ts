import type { AppModule, AppRouter } from '#core/base/AppModule';
import { UserRouter } from '#app/user/user.routes';

export class UserModule implements AppModule {
  registerRoutes(router: AppRouter): void {
    router.useRouter('/users', new UserRouter());
  }
}
