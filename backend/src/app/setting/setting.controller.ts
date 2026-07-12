import httpStatus from 'http-status';
import { z } from 'zod';
import { type Request, type Response } from 'express';
import { inject, injectable } from 'inversify';
import ApiError from '#utils/ApiError';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { SettingService } from '#app/setting/setting.service';
import { SettingsRegistry } from '#app/setting/setting.registry';
import { SettingResource } from '#app/setting/setting.resource';

const paramsSchema = z.object({
  params: z.object({
    campId: z.ulid(),
    key: z.string(),
  }),
});

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
    const camp = req.modelOrFail('camp');
    const { params } = await req.validate(paramsSchema);
    this.settingsRegistry.getOrFail(params.key);

    const setting = await this.settingService.getSetting(camp.id, params.key);
    if (!setting) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        `No setting stored for "${params.key}"`,
      );
    }

    res.resource(new SettingResource(setting));
  }

  async update(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    // The key (and thus the body schema) is only known once params are read,
    // so validation happens in two passes: params first, then params+body
    // against a schema built from the key's registered definition.
    const { params: keyParams } = await req.validate(paramsSchema);
    const definition = this.settingsRegistry.getOrFail(keyParams.key);

    const updateSchema = paramsSchema.extend({
      body: z.object({ data: definition.schema }),
    });
    const { params, body } = await req.validate(updateSchema);

    const setting = await this.settingService.upsertSetting(
      camp.id,
      params.key,
      // The per-key schema type is erased to `unknown` by `getOrFail`, but
      // `body.data` was just validated against that exact schema above, and
      // by convention every registered setting is an object shape.
      body.data as Record<string, unknown>,
    );

    void this.realtimeService.emit(camp.id, 'setting', params.key, 'updated');

    res.resource(new SettingResource(setting));
  }
}
