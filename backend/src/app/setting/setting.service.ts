import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';

@injectable()
export class SettingService extends BaseService {
  async getSetting(campId: string, key: string) {
    return this.prisma.campSetting.findUnique({
      where: { campId_key: { campId, key } },
    });
  }

  async upsertSetting(
    campId: string,
    key: string,
    data: Record<string, unknown>,
  ) {
    return this.prisma.campSetting.upsert({
      where: { campId_key: { campId, key } },
      create: { campId, key, data },
      update: { data },
    });
  }
}
