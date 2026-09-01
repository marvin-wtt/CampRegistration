import { auth, guard } from '#middlewares/index';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { SettingController } from '#app/setting/setting.controller';
import { settingGuard } from '#app/setting/setting.guard';
import { inject, injectable } from 'inversify';

@injectable()
export class SettingRouter extends ModuleRouter {
  constructor(
    @inject(SettingController)
    private readonly settingController: SettingController,
  ) {
    super();
  }

  protected registerBindings() {
    // No model binding: `key` is a registry lookup, not a bound DB entity.
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/:key',
      auth(),
      guard(settingGuard('view')),
      controller(this.settingController, 'show'),
    );
    this.router.put(
      '/:key',
      auth(),
      guard(settingGuard('edit')),
      controller(this.settingController, 'update'),
    );
  }
}
