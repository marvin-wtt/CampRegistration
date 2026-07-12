import type { CampSetting as CampSettingModel } from '#generated/prisma/client.js';
import type { CampSetting as CampSettingData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export class SettingResource extends JsonResource<
  CampSettingModel,
  CampSettingData
> {
  transform(): CampSettingData {
    return {
      id: this.data.id,
      key: this.data.key,
      data: this.data.data,
    };
  }
}
