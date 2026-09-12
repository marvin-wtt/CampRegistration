import type { BindOptions } from '#core/base/AppModule';
import type { CoreModule } from '#core/base/CoreModule';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { resolve } from '#core/ioc/container';

/**
 * Provides the realtime mechanism (the {@link RealtimeService} backplane and the
 * `realtimeStream` handler factory). It registers no routes and has no knowledge
 * of feature resources — each feature module mounts its own stream with its own
 * guard, so dependencies point feature → realtime only.
 */
export class RealtimeModule implements CoreModule {
  bindContainers(options: BindOptions) {
    options.bind(RealtimeService).toSelf().inSingletonScope();
  }

  async shutdown(): Promise<void> {
    await resolve(RealtimeService).shutdown();
  }
}
