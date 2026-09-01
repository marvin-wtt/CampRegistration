import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { ChoreAssignmentRouter } from '#app/choreAssignment/choreAssignment.routes';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { ChoreAssignmentService } from '#app/choreAssignment/choreAssignment.service';
import { ChoreAssignmentController } from '#app/choreAssignment/choreAssignment.controller';
import { resolve } from '#core/ioc/container';

export class ChoreAssignmentModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(ChoreAssignmentService).toSelf().inSingletonScope();
    options.bind(ChoreAssignmentController).toSelf().inSingletonScope();
    options.bind(ChoreAssignmentRouter).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter(
      '/events/:eventId/chore-assignments',
      resolve(ChoreAssignmentRouter),
    );
  }

  registerPermissions(): ScopedPermissions {
    return {
      event: {
        DIRECTOR: [
          'event.chore_assignments.view',
          'event.chore_assignments.create',
          'event.chore_assignments.edit',
          'event.chore_assignments.delete',
        ],
        COORDINATOR: [
          'event.chore_assignments.view',
          'event.chore_assignments.create',
          'event.chore_assignments.edit',
          'event.chore_assignments.delete',
        ],
        COUNSELOR: [
          'event.chore_assignments.view',
          'event.chore_assignments.create',
          'event.chore_assignments.edit',
          'event.chore_assignments.delete',
        ],
        VIEWER: ['event.chore_assignments.view'],
      },
    };
  }
}
