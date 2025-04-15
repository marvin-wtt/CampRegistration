import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import profileRoutes from '#app/profile/profile.routes';

export class ProfileModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    router.use('/profile', profileRoutes);
  }
}
