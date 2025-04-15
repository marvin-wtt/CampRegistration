import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import userRoutes from '#app/user/user.routes';
import userService from '#app/user/user.service';
import { registerRouteModelBinding } from '#core/router.';

export class UserModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    registerRouteModelBinding('user', (_req, id) =>
      userService.getUserById(id),
    );

    router.use('/users', userRoutes);
  }
}
