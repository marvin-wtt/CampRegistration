import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { QueueService } from '#app/queue/queue.service';
import { QueueController } from '#app/queue/queue.controller';
import { QueueRouter } from '#app/queue/queue.routes';

export class QueueModule implements AppModule {
  bindContainers(options: BindOptions): void {
    options.bind(QueueService).toSelf().inSingletonScope();
    options.bind(QueueController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/admin/queues', new QueueRouter());
  }
}
