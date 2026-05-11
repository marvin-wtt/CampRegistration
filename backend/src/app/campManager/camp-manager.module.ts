import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
  BindOptions,
  ModuleOptions,
} from '#core/base/AppModule';
import { CampManagerRouter } from '#app/campManager/camp-manager.routes';
import type { ManagerPermission } from '@camp-registration/common/permissions';
import { CampManagerController } from '#app/campManager/camp-manager.controller';
import { CampManagerService } from '#app/campManager/camp-manager.service';
import { MailableRegistry } from '#app/mail/mail.registry';
import { CampManagerInvitationMessage } from '#app/campManager/camp-manager.messages';
import { resolve } from '#core/ioc/container';

export class CampManagerModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(CampManagerController).toSelf().inSingletonScope();
    options.bind(CampManagerService).toSelf().inSingletonScope();
  }

  configure(_options: ModuleOptions): Promise<void> | void {
    resolve(MailableRegistry).register(CampManagerInvitationMessage);
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/camps/:campId/managers', new CampManagerRouter());
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
