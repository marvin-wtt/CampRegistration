import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { UserRouter } from '#app/user/user.routes';
import { UserService } from '#app/user/user.service';
import { UserController } from '#app/user/user.controller';

export class UserModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(UserService).toSelf().inSingletonScope();
    options.bind(UserController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/users', new UserRouter());
  }
}
