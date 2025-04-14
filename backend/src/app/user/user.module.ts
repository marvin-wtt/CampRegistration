import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import userRoutes from '#app/user/user.routes';

export class UserModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    router.use('/users', userRoutes);
  }
}
