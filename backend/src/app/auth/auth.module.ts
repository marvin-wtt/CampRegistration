import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import authRoutes from '#app/auth/auth.routes';

export class AuthModule implements AppModule {
  configure({ router }: ModuleOptions) {
    router.use('/auth', authRoutes);
  }
}
