import type { SettingKey } from '@camp-registration/common/settings';
import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';

@injectable()
export class SettingService extends BaseService {
  async getSetting(campId: string, key: SettingKey) {
    return this.prisma.campSetting.findUnique({
      where: { campId_key: { campId, key } },
    });
  }

  async upsertSetting(
    campId: string,
    key: SettingKey,
    data: Record<string, unknown>,
  ) {
    return this.prisma.campSetting.upsert({
      where: { campId_key: { campId, key } },
      create: { campId, key, data },
      update: { data },
    });
  }
}
