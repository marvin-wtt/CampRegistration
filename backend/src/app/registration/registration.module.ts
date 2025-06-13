import type {
  AppModule,
  ModuleOptions,
  RoleToPermissions,
} from '#core/base/AppModule';
import registrationRoutes from '#app/registration/registration.routes';
import registrationService from '#app/registration/registration.service';
import { registerRouteModelBinding } from '#core/router';
import type { RegistrationPermission } from '@camp-registration/common/permissions';
import { registerFileGuard } from '#app/file/file.guard';
import { campManager, type GuardFn } from '#guards/index';
import type { Request } from 'express';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import campService from '#app/camp/camp.service.js';

export class RegistrationModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    registerRouteModelBinding('registration', (req, id) => {
      const camp = req.modelOrFail('camp');
      return registrationService.getRegistrationById(camp.id, id);
    });

    // Register the registration file guard
    registerFileGuard('registration', this.registrationFileGuard);

    router.use('/camps/:campId/registrations', registrationRoutes);
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
