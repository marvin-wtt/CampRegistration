import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import registrationRoutes from '#app/registration/registration.routes';
import registrationService from '#app/registration/registration.service';
import { registerRouteModelBinding } from '#core/router';

export class RegistrationModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    registerRouteModelBinding('registration', (req, id) => {
      const camp = req.modelOrFail('camp');
      return registrationService.getRegistrationById(camp.id, id);
    });

    router.use('/camps/:campId/registrations', registrationRoutes);
  }
}
