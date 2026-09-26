import type { EventSetting as EventSettingModel } from '#generated/prisma/client.js';
import type { EventSetting as EventSettingData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export class SettingResource extends JsonResource<
  EventSettingModel,
  EventSettingData
> {
  transform(): EventSettingData {
    return {
      id: this.data.id,
      key: this.data.key,
      data: this.data.data,
    };
  }
}
