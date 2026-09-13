import type { BindOptions } from '#core/base/AppModule';
import type { CoreModule } from '#core/base/CoreModule';
import { QueueManager } from '#core/queue/QueueManager';
import { resolve } from '#core/ioc/container';

export class QueueManagerModule implements CoreModule {
  bindContainers(options: BindOptions) {
    options.bind(QueueManager).toSelf().inSingletonScope();
  }

  async shutdown(): Promise<void> {
    await resolve(QueueManager).close();
  }
}
