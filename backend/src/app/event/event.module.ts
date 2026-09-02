import type {
  AppModule,
  AppRouter,
  BindOptions,
  ModuleOptions,
} from '#core/base/AppModule';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import type { ScopeResolvers } from '#core/permission.guard';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import { EventRouter } from '#app/event/event.routes';
import { registerFileGuard } from '#app/file/file.guard';
import { eventFileGuards, eventScopeResolver } from '#app/event/event.guard';
import { EventFilesRouter } from '#app/event/event-files.routes';
import { EventService } from '#app/event/event.service';
import { EventController } from '#app/event/event.controller';
import { SettingsRegistry } from '#app/setting/setting.registry';
import { NavigationSettingsValidation } from '#app/event/event.settings.validation';
import { resolve } from '#core/ioc/container';

export class EventModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(EventService).toSelf().inSingletonScope();
    options.bind(EventController).toSelf().inSingletonScope();
  }

  configure(_options: ModuleOptions): void {
    resolve(SettingsRegistry).register(SETTING_KEYS.NAVIGATION, {
      schema: NavigationSettingsValidation,
      viewPermission: 'event.view',
      editPermission: 'event.edit',
    });
  }

  registerScopeResolvers(): ScopeResolvers {
    return { event: eventScopeResolver };
  }

  registerRoutes(router: AppRouter): void {
    registerFileGuard('event', eventFileGuards);

    router.useRouter('/events/:eventId/files', new EventFilesRouter());
    router.useRouter('/events', new EventRouter());
  }

  registerPermissions(): ScopedPermissions {
    return {
      event: {
        DIRECTOR: [
          'event.view',
          'event.edit',
          'event.delete',

          'event.files.view',
          'event.files.create',
          'event.files.edit',
          'event.files.delete',
        ],
        COORDINATOR: [
          'event.view',
          'event.edit',

          'event.files.view',
          'event.files.create',
          'event.files.edit',
          'event.files.delete',
        ],
        COUNSELOR: ['event.view', 'event.files.view'],
        VIEWER: ['event.view', 'event.files.view'],
      },
    };
  }
}
