import type { CoreModule } from '#core/base/CoreModule';
import { initI18n } from '#core/i18n/i18n.client';

export class I18nModule implements CoreModule {
  async configure(): Promise<void> {
    await initI18n();
  }
}
