import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { UserRouter } from '#app/user/user.routes';
import { UserService } from '#app/user/user.service';
import { UserController } from '#app/user/user.controller';
import { AccountLifecycle } from '#app/user/account.lifecycle';

export class UserModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(AccountLifecycle).toSelf().inSingletonScope();
    options.bind(UserService).toSelf().inSingletonScope();
    options.bind(UserController).toSelf().inSingletonScope();
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter('/users', new UserRouter());
  }
}
