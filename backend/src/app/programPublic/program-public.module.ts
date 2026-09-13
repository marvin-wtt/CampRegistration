import type {
  AppModule,
  AppRouter,
  BindOptions,
  ModuleOptions,
} from '#core/base/AppModule';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import { resolve } from '#core/ioc/container';
import { SettingsRegistry } from '#app/setting/setting.registry';
import { ProgramPublicSettingsValidation } from './program-public.validation.js';
import { ProgramPublicService } from './program-public.service.js';
import { ProgramPublicController } from './program-public.controller.js';
import { ProgramPublicRouter } from './program-public.routes.js';
import { createProgramPublicMetaRouter } from './program-public-meta.routes.js';

export class ProgramPublicModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(ProgramPublicService).toSelf().inSingletonScope();
    options.bind(ProgramPublicController).toSelf().inSingletonScope();
    options.bind(ProgramPublicRouter).toSelf().inSingletonScope();
  }

  configure(_options: ModuleOptions): void {
    resolve(SettingsRegistry).register(SETTING_KEYS.PROGRAM_PUBLIC, {
      schema: ProgramPublicSettingsValidation,
      viewPermission: 'event.program_items.view',
      editPermission: 'event.program_items.update',
    });
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter(
      '/events/:eventId/program-public',
      resolve(ProgramPublicRouter),
    );
  }

  registerWebRoutes(router: AppRouter): void {
    router.use('/events', createProgramPublicMetaRouter());
  }
}
