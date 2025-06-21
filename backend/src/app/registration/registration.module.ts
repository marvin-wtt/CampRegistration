import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
} from '#core/base/AppModule';
import { RegistrationRouter } from '#app/registration/registration.routes';
import type { RegistrationPermission } from '@camp-registration/common/permissions';

export class RegistrationModule implements AppModule {
  registerRoutes(router: AppRouter): void {
    router.useRouter('/camps/:campId/registrations', new RegistrationRouter());
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
