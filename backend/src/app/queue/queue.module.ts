import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import { QueueService } from '#app/queue/queue.service';
import { QueueController } from '#app/queue/queue.controller';
import { QueueRouter } from '#app/queue/queue.routes';
import { QueueManager } from '#core/queue/QueueManager';
import { resolve } from '#core/ioc/container';
import logger from '#core/logger';

export class QueueModule implements AppModule {
  bindContainers(options: BindOptions): void {
    options.bind(QueueService).toSelf().inSingletonScope();
    options.bind(QueueController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/admin/queues', new QueueRouter());
  }

  registerJobs(scheduler: JobScheduler): void {
    scheduler.schedule('queue-job-cleanup', '45 4 * * *', async () => {
      const { completed, failed } = await resolve(QueueService).deleteOldJobs();
      logger.info(
        `Deleted ${completed.toString()} completed and ${failed.toString()} failed job(s)`,
      );
    });
  }

  async shutdown(): Promise<void> {
    await resolve(QueueManager).close();
  }
}
