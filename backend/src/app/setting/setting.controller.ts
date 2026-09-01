import httpStatus from 'http-status';
import { type Request, type Response } from 'express';
import { inject, injectable } from 'inversify';
import ApiError from '#utils/ApiError';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { SettingService } from '#app/setting/setting.service';
import { SettingsRegistry } from '#app/setting/setting.registry';
import { SettingResource } from '#app/setting/setting.resource';
import validator, { validateBody } from './setting.validation.js';

@injectable()
export class SettingController extends BaseController {
  constructor(
    @inject(SettingService)
    private readonly settingService: SettingService,
    @inject(SettingsRegistry)
    private readonly settingsRegistry: SettingsRegistry,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  async show(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const { params } = await req.validate(validator.show);
    const key = this.settingsRegistry.keyOrFail(params.key);

    const setting = await this.settingService.getSetting(event.id, key);
    if (!setting) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        `No setting stored for "${key}"`,
      );
    }

    res.resource(new SettingResource(setting));
  }

  async update(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const { params } = await req.validate(validator.update);
    const key = this.settingsRegistry.keyOrFail(params.key);
    const definition = this.settingsRegistry.getOrFail(key);

    const { body } = await req.validate(validateBody(definition.schema));

    const setting = await this.settingService.upsertSetting(
      event.id,
      key,
      // The per-key schema type is erased to `unknown` by `getOrFail`, but
      // `body.data` was just validated against that exact schema above, and
      // by convention every registered setting is an object shape.
      body.data as Record<string, unknown>,
    );

    void this.realtimeService.emit(event.id, 'setting', key, 'updated');

    res.resource(new SettingResource(setting));
  }
}
