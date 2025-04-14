import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import registrationRoutes from '#app/registration/registration.routes';

export class RegistrationModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    router.use('/camps/:campId/registration', registrationRoutes);
  }
}
