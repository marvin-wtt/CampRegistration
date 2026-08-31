import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { DutyAssignmentRouter } from '#app/dutyAssignment/dutyAssignment.routes';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { DutyAssignmentService } from '#app/dutyAssignment/dutyAssignment.service';
import { DutyAssignmentController } from '#app/dutyAssignment/dutyAssignment.controller';
import { resolve } from '#core/ioc/container';

export class DutyAssignmentModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(DutyAssignmentService).toSelf().inSingletonScope();
    options.bind(DutyAssignmentController).toSelf().inSingletonScope();
    options.bind(DutyAssignmentRouter).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter(
      '/events/:eventId/duty-assignments',
      resolve(DutyAssignmentRouter),
    );
  }

  registerPermissions(): ScopedPermissions {
    return {
      event: {
        DIRECTOR: [
          'event.duty_assignments.view',
          'event.duty_assignments.create',
          'event.duty_assignments.edit',
          'event.duty_assignments.delete',
        ],
        COORDINATOR: [
          'event.duty_assignments.view',
          'event.duty_assignments.create',
          'event.duty_assignments.edit',
          'event.duty_assignments.delete',
        ],
        COUNSELOR: [
          'event.duty_assignments.view',
          'event.duty_assignments.create',
          'event.duty_assignments.edit',
          'event.duty_assignments.delete',
        ],
        VIEWER: ['event.duty_assignments.view'],
      },
    };
  }
}
