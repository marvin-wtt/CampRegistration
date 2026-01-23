import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
  BindOptions,
  ModuleOptions,
} from '#core/base/AppModule';
import { ManagerRouter } from '#app/manager/manager.routes';
import type { ManagerPermission } from '@camp-registration/common/permissions';
import { ManagerController } from '#app/manager/manager.controller';
import { ManagerService } from '#app/manager/manager.service';
import { registerMailable } from '#app/mail/mail.registry';
import { ManagerInvitationMessage } from '#app/manager/manager.messages';

export class ManagerModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(ManagerController).toSelf().inSingletonScope();
    options.bind(ManagerService).toSelf().inSingletonScope();
  }

  configure(_options: ModuleOptions): Promise<void> | void {
    registerMailable(ManagerInvitationMessage);
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/camps/:campId/managers', new ManagerRouter());
  }

  registerPermissions(): RoleToPermissions<ManagerPermission> {
    return {
      DIRECTOR: [
        'camp.managers.view',
        'camp.managers.create',
        'camp.managers.edit',
        'camp.managers.delete',
      ],
      COORDINATOR: ['camp.managers.view'],
      COUNSELOR: ['camp.managers.view'],
      VIEWER: [],
    };
  }
}
