import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
} from '#core/base/AppModule';
import { RegistrationRouter } from '#app/registration/registration.routes';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import type { RegistrationPermission } from '@camp-registration/common/permissions';
import { registerFileGuard } from '#app/file/file.guard';

export class RegistrationModule implements AppModule {
  configure(): Promise<void> | void {
    registerFileGuard('registration', this.registrationFileGuard);
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/camps/:campId/registrations', new RegistrationRouter());
  }

  private registrationFileGuard = async (req: Request): Promise<GuardFn> => {
    const file = req.modelOrFail('file');

    if (!file.registrationId) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Invalid guard handler',
      );
    }

    const registration = await registrationService.getRegistrationWithCampById(
      file.registrationId,
    );
    if (!registration) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Registration related to file not found',
      );
    }
    const camp = await campService.getCampById(registration.camp.id);

    req.setModelOrFail('registration', registration);
    req.setModelOrFail('camp', camp);

    return campManager('camp.registrations.view');
  };

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
