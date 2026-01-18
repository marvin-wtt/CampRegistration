import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { AuthRouter } from '#app/auth/auth.routes';
import { AuthController } from '#app/auth/auth.controller';
import { AuthService } from '#app/auth/auth.service';

export class AuthModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(AuthService).toSelf().inSingletonScope();
    options.bind(AuthController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/auth', new AuthRouter());
  }
}
