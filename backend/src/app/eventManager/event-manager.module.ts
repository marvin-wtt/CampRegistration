import type {
  AppModule,
  AppRouter,
  BindOptions,
  ModuleOptions,
} from '#core/base/AppModule';
import { EventManagerRouter } from '#app/eventManager/event-manager.routes';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { EventManagerController } from '#app/eventManager/event-manager.controller';
import { EventManagerService } from '#app/eventManager/event-manager.service';
import { MailableRegistry } from '#app/mail/mail.registry';
import { EventManagerInvitationMessage } from '#app/eventManager/event-manager.messages';
import { resolve } from '#core/ioc/container';

export class EventManagerModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(EventManagerController).toSelf().inSingletonScope();
    options.bind(EventManagerService).toSelf().inSingletonScope();
  }

  configure(_options: ModuleOptions): Promise<void> | void {
    resolve(MailableRegistry).register(EventManagerInvitationMessage);
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/events/:eventId/managers', new EventManagerRouter());
  }

  registerPermissions(): ScopedPermissions {
    return {
      event: {
        DIRECTOR: [
          'event.managers.view',
          'event.managers.create',
          'event.managers.edit',
          'event.managers.delete',
        ],
        COORDINATOR: ['event.managers.view'],
        COUNSELOR: ['event.managers.view'],
        VIEWER: ['event.managers.view'],
      },
    };
  }
}
