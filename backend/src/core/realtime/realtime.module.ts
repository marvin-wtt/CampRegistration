import type { BindOptions } from '#core/base/AppModule';
import type { CoreModule } from '#core/base/CoreModule';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { resolve } from '#core/ioc/container';

/**
 * Provides the realtime backplane only: feature modules mount their own
 * stream with their own guard, so dependencies point feature → realtime.
 */
export class RealtimeModule implements CoreModule {
  bindContainers(options: BindOptions) {
    options.bind(RealtimeService).toSelf().inSingletonScope();
  }

  async shutdown(): Promise<void> {
    await resolve(RealtimeService).shutdown();
  }
}
