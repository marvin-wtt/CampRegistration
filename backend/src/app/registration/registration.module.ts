import type {
  AppModule,
  ModuleOptions,
  RoleToPermissions,
} from '#core/base/AppModule';
import registrationRoutes from '#app/registration/registration.routes';
import registrationService from '#app/registration/registration.service';
import { registerRouteModelBinding } from '#core/router';
import type { RegistrationPermission } from '@camp-registration/common/permissions';

export class RegistrationModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    registerRouteModelBinding('registration', (req, id) => {
      const camp = req.modelOrFail('camp');
      return registrationService.getRegistrationById(camp.id, id);
    });

    router.use('/camps/:campId/registrations', registrationRoutes);
  }

  registerPermissions(): RoleToPermissions<RegistrationPermission> {
    return {
      DIRECTOR: [
        'camp.registrations.view',
        'camp.registrations.edit',
        'camp.registrations.delete',
      ],
      COORDINATOR: [
        'camp.registrations.view',
        'camp.registrations.edit',
        'camp.registrations.delete',
      ],
      COUNSELOR: ['camp.registrations.view'],
      VIEWER: ['camp.registrations.view'],
    };
  }
}
