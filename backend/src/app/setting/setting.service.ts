import type { SettingKey } from '@camp-registration/common/settings';
import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';

@injectable()
export class SettingService extends BaseService {
  async getSetting(eventId: string, key: SettingKey) {
    return this.prisma.eventSetting.findUnique({
      where: { eventId_key: { eventId, key } },
    });
  }

  async upsertSetting(
    eventId: string,
    key: SettingKey,
    data: Record<string, unknown>,
  ) {
    return this.prisma.eventSetting.upsert({
      where: { eventId_key: { eventId, key } },
      create: { eventId, key, data },
      update: { data },
    });
  }
}
