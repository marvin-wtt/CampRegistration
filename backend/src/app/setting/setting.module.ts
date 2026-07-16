import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { resolve } from '#core/ioc/container';
import { SettingsRegistry } from '#app/setting/setting.registry';
import { SettingService } from '#app/setting/setting.service';
import { SettingController } from '#app/setting/setting.controller';
import { SettingRouter } from '#app/setting/setting.routes';

export class SettingModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(SettingsRegistry).toSelf().inSingletonScope();
    options.bind(SettingService).toSelf().inSingletonScope();
    options.bind(SettingController).toSelf().inSingletonScope();
    options.bind(SettingRouter).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/camps/:campId/settings', resolve(SettingRouter));
  }
}
