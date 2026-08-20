import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { TaskRouter } from '#app/task/task.routes';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { TaskService } from '#app/task/task.service';
import { TaskController } from '#app/task/task.controller';
import { resolve } from '#core/ioc/container';

export class TaskModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(TaskService).toSelf().inSingletonScope();
    options.bind(TaskController).toSelf().inSingletonScope();
    options.bind(TaskRouter).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/camps/:campId/tasks', resolve(TaskRouter));
  }

  registerPermissions(): ScopedPermissions {
    return {
      camp: {
        DIRECTOR: [
          'camp.tasks.view',
          'camp.tasks.create',
          'camp.tasks.update',
          'camp.tasks.delete',
        ],
        COORDINATOR: [
          'camp.tasks.view',
          'camp.tasks.create',
          'camp.tasks.update',
          'camp.tasks.delete',
        ],
        COUNSELOR: [
          'camp.tasks.view',
          'camp.tasks.create',
          'camp.tasks.update',
          'camp.tasks.delete',
        ],
        VIEWER: ['camp.tasks.view'],
      },
    };
  }
}
